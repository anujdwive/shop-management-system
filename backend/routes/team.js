const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Shop = require("../models/Shop");
const Employee = require("../models/Employee");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All team routes require authentication.
router.use(protect);

// @route   POST /api/team
// @desc    Owner creates a Manager or Worker
// @access  Private - Owner only
router.post("/", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const ownerId = req.user._id;
    const {
      name,
      email,
      phone,
      role,
      shops,
      reportsTo,
      salary,
      salaryType,
      designation,
      department,
    } = req.body;

    // 1. Owner authorization
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owners can create team members",
      });
    }

    // 2. Basic validation
    if (
      !name?.trim() ||
      !email?.trim() ||
      !["manager", "worker"].includes(role)
    ) {
      return res.status(400).json({
        message: "Name, email and valid role are required",
      });
    }

    if (!Array.isArray(shops) || shops.length === 0) {
      return res.status(400).json({
        message: "Select at least one shop",
      });
    }

    if (salary === undefined || salary === null || salary === "") {
      return res.status(400).json({
        message: "Salary is required",
      });
    }

    if (!Number.isFinite(Number(salary)) || Number(salary) < 0) {
      return res.status(400).json({
        message: "Salary must be a valid non-negative number",
      });
    }

    if (shops.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({
        message: "Invalid shop ID",
      });
    }

    // Avoid duplicate shop IDs.
    const shopIds = [...new Set(shops.map(String))];

    // 3. Validate all selected shops belong to this owner.
    const ownedShops = await Shop.find({
      _id: { $in: shopIds },
      owner: ownerId,
      status: "active",
    })
      .select("_id")
      .session(session);

    if (ownedShops.length !== shopIds.length) {
      return res.status(400).json({
        message: "One or more shops are invalid, inactive, or not owned by you",
      });
    }

    // 4. Validate reporting manager for a worker.
    let manager = null;

    if (reportsTo) {
      if (role !== "worker" || !mongoose.isValidObjectId(reportsTo)) {
        return res.status(400).json({
          message: "Invalid reporting manager",
        });
      }

      manager = await User.findOne({
        _id: reportsTo,
        ownerId,
        role: "manager",
        status: "active",
      }).session(session);

      if (!manager) {
        return res.status(400).json({
          message: "Reporting manager not found",
        });
      }

      // The manager must be assigned to every selected shop.
      const managerShopIds = manager.shops.map(String);
      const managerHasAllShops = shopIds.every((id) =>
        managerShopIds.includes(id),
      );

      if (!managerHasAllShops) {
        return res.status(400).json({
          message: "Reporting manager must be assigned to all selected shops",
        });
      }
    }

    // 5. Check whether email is already registered.
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    }).session(session);

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    // 6. Prepare a random temporary password.
    // The user will eventually set their own password
    // through the invitation acceptance flow.
    const temporaryPassword = crypto.randomBytes(32).toString("hex");

    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    const invitationToken = crypto.randomBytes(32).toString("hex");

    const invitationTokenHash = crypto
      .createHash("sha256")
      .update(invitationToken)
      .digest("hex");

    const invitationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let createdUser;
    let createdEmployee;

    // 7. Create both records in one transaction.
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [
          {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone,
            role,
            shops: shopIds,
            ownerId,
            reportsTo: role === "worker" ? reportsTo || null : null,
            status: "inactive",
            invitationStatus: "pending",
            invitationTokenHash,
            invitationExpiresAt,
          },
        ],
        { session },
      );

      const generatedEmployeeId = `EMP-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

      const employeeDesignation =
        designation || (role === "manager" ? "Manager" : "Worker");

      const [employee] = await Employee.create(
        [
          {
            userId: user._id,
            shopId: shopIds[0],
            employeeId: generatedEmployeeId,
            designation: employeeDesignation,
            department,
            salary: Number(salary),
            salaryType: salaryType || "monthly",
            status: "inactive",
          },
        ],
        { session },
      );

      // Keep Shop.managers synchronized for managers.
      if (role === "manager") {
        await Shop.updateMany(
          { _id: { $in: shopIds }, owner: ownerId },
          { $addToSet: { managers: user._id } },
          { session },
        );
      }

      createdUser = user;
      createdEmployee = employee;
    });

    // Do not return the password or invitation token.
    // Email delivery and acceptance will be implemented next.
    return res.status(201).json({
      message: "Team member created. Invitation is pending.",
      teamMember: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        shops: createdUser.shops,
        reportsTo: createdUser.reportsTo,
        status: createdUser.status,
        invitationStatus: createdUser.invitationStatus,
        employeeId: createdEmployee.employeeId,
      },
      ...(process.env.NODE_ENV !== "production" ? { invitationToken } : {}),
    });
  } catch (error) {
    console.error("Create team member error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email or employee ID already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to create team member",
    });
  } finally {
    await session.endSession();
  }
});

// @route   GET /api/team
// @desc    Get the owner's team and reporting relationships
// @access  Private - Owner only
router.get("/", async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owners can view the complete team",
      });
    }

    const team = await User.find({
      ownerId: req.user._id,
      role: { $in: ["manager", "worker"] },
    })
      .select(
        "name email phone role shops ownerId reportsTo status invitationStatus createdAt",
      )
      .populate("shops", "name location status")
      .populate("reportsTo", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const userIds = team.map((member) => member._id);

    const employees = await Employee.find({
      userId: { $in: userIds },
    })
      .select(
        "userId employeeId shopId designation department salary salaryType status joinDate",
      )
      .populate("shopId", "name location")
      .lean();

    const employeeByUserId = new Map(
      employees.map((employee) => [String(employee.userId), employee]),
    );

    const teamWithEmployees = team.map((member) => ({
      ...member,
      employee: employeeByUserId.get(String(member._id)) || null,
    }));

    return res.status(200).json({
      count: teamWithEmployees.length,
      team: teamWithEmployees,
    });
  } catch (error) {
    console.error("Get team error:", error);

    return res.status(500).json({
      message: "Failed to fetch team",
    });
  }
});

module.exports = router;
