const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const Employee = require("../models/Employee");

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "owner",
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // 1. Email se user find karo
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select("+password");

  // 2. User exist karta hai ya nahi
  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  // 3. Password verify karo
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  // 4. Account active hai ya nahi
  if (user.status !== "active") {
    return res.status(403).json({
      message: "Account is inactive",
    });
  }

  // 5. Token generate karo
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  return res.json({
    success: true,
    token,
  });
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    // Token already verified by protect middleware
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/accept-invitation", async (req, res) => {
  const session = await User.startSession();

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Invitation token and password are required",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: "Invalid or expired invitation",
      });
    }

    const tokenHash = require("crypto")
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      invitationTokenHash: tokenHash,
      invitationStatus: "pending",
      invitationExpiresAt: { $gt: new Date() },
      status: "inactive",
      role: { $in: ["manager", "worker"] },
    })
      .select("+invitationTokenHash +invitationExpiresAt")
      .session(session);

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired invitation",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await session.withTransaction(async () => {
      user.password = hashedPassword;
      user.status = "active";
      user.invitationStatus = "accepted";
      user.invitationTokenHash = undefined;
      user.invitationExpiresAt = undefined;

      await user.save({ session });

      const employeeResult = await Employee.updateMany(
        {
          userId: user._id,
          status: "inactive",
        },
        {
          $set: { status: "active" },
        },
        { session },
      );

      if (employeeResult.matchedCount === 0) {
        throw new Error("Employee record not found");
      }
    });

    return res.status(200).json({
      message: "Invitation accepted. You can now log in.",
    });
  } catch (error) {
    console.error("Accept invitation error:", error);

    return res.status(500).json({
      message: "Failed to accept invitation",
    });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
