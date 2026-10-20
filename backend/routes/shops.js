const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Shop = require("../models/Shop");
const User = require("../models/User");

const { protect, owner, ownerOrManager } = require("../middleware/auth");

// Helpers
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isAssignedToShop = (user, shop) => {
  const assignedShops = Array.isArray(user.shops) ? user.shops : [];

  return assignedShops.some((shopId) => String(shopId) === String(shop._id));
};

const canAccessShop = (user, shop) => {
  if (user.role === "owner") {
    return String(shop.owner) === String(user._id);
  }

  return isAssignedToShop(user, shop);
};

// @route   GET /api/shops
// @desc    Get shops accessible to the current user
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const searchText = String(req.query.search || "").trim();

    const page = Math.max(Math.floor(Number(req.query.page) || 1), 1);

    const limit = Math.min(
      Math.max(Math.floor(Number(req.query.limit) || 10), 1),
      100,
    );

    const skip = (page - 1) * limit;
    const filter = {};

    if (searchText) {
      const safeSearch = escapeRegex(searchText);

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { location: { $regex: safeSearch, $options: "i" } },
        { address: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Owner: only owned shops

    if (req.user.role === "owner") {
      filter.owner = req.user._id;
    } else if (["manager", "worker"].includes(req.user.role)) {
      // Manager / Worker: only assigned shops
      const assignedShops = Array.isArray(req.user.shops) ? req.user.shops : [];
      filter._id = { $in: assignedShops };
    } else {
      return res.status(403).json({
        success: false,
        message: "Role not authorized",
      });
    }

    const [shops, totalShops] = await Promise.all([
      Shop.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("owner", "name email")
        .populate("managers", "name email"),

      Shop.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalShops / limit);

    return res.status(200).json({
      success: true,
      data: shops,
      pagination: {
        page,
        limit,
        totalShops,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get shops error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/shops/options
// @desc    Get shop options for Owner / Manager
// @access  Private (Owner / Manager)
router.get("/options", protect, ownerOrManager, async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "owner") {
      filter.owner = req.user._id;
    } else if (["manager", "worker"].includes(req.user.role)) {
      // Manager / Worker: only assigned shops
      const assignedShops = Array.isArray(req.user.shops) ? req.user.shops : [];
      filter._id = { $in: assignedShops };
    } else {
      return res.status(403).json({
        success: false,
        message: "Role not authorized",
      });
    }

    const shops = await Shop.find(filter).select("_id name").lean();

    return res.status(200).json({
      success: true,
      data: shops,
    });
  } catch (error) {
    console.error("Get shop options error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/shops/:id
// @desc    Get a single accessible shop
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shop ID",
      });
    }

    const shop = await Shop.findById(id)
      .populate("owner", "name email phone")
      .populate("managers", "name email phone");

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    if (!canAccessShop(req.user, shop)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this shop",
      });
    }

    return res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    console.error("Get shop error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/shops
// @desc    Create a shop
// @access  Private (Owner only)
router.post("/", protect, owner, async (req, res) => {
  try {
    const { name, location, address, phone, businessType } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Shop name is required",
      });
    }

    const shop = await Shop.create({
      name: name.trim(),
      location,
      address,
      phone,
      businessType,
      owner: req.user._id,
    });

    // Keep the owner's assigned-shop list consistent
    const updatedOwner = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { shops: shop._id } },
      { new: true },
    );

    if (!updatedOwner) {
      await shop.deleteOne();

      return res.status(500).json({
        success: false,
        message: "Could not associate shop with owner",
      });
    }

    return res.status(201).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    console.error("Create shop error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create shop",
    });
  }
});

// @route   PUT /api/shops/:id
// @desc    Update shop settings
// @access  Private (Owner only)
router.put("/:id", protect, owner, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shop ID",
      });
    }

    const shop = await Shop.findById(id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    // A role check alone is not enough.
    // This owner must own the requested shop.
    if (!canAccessShop(req.user, shop)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own shops",
      });
    }

    const allowedFields = [
      "name",
      "location",
      "address",
      "phone",
      "businessType",
      "status",
    ];

    for (const field of allowedFields) {
      if (req.body[field] === undefined) {
        continue;
      }

      const value = req.body[field];

      if (typeof value !== "string") {
        return res.status(400).json({
          success: false,
          message: `Invalid value for ${field}`,
        });
      }

      if (field === "name" && !value.trim()) {
        return res.status(400).json({
          success: false,
          message: "Shop name cannot be empty",
        });
      }

      shop[field] = value.trim();
    }

    await shop.save();

    return res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    console.error("Update shop error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid shop data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not update shop",
    });
  }
});

// @route   DELETE /api/shops/:id
// @desc    Delete a shop
// @access  Private (Owner only)
router.delete("/:id", protect, owner, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shop ID",
      });
    }

    const shop = await Shop.findById(id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    // Prevent one owner from deleting another owner's shop
    if (!canAccessShop(req.user, shop)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own shops",
      });
    }

    await shop.deleteOne();

    // Remove this shop from every user's assignment list
    await User.updateMany({ shops: shop._id }, { $pull: { shops: shop._id } });

    return res.status(200).json({
      success: true,
      message: "Shop removed",
    });
  } catch (error) {
    console.error("Delete shop error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete shop",
    });
  }
});

module.exports = router;
