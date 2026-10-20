const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify token and identify the current user
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Validate Authorization header
  if (!authHeader || !/^Bearer\s+\S+$/i.test(authHeader)) {
    return res.status(401).json({
      message: "Not authorized, token required",
    });
  }

  const token = authHeader.split(/\s+/)[1];

  // 2. Verify JWT
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, invalid or expired token",
    });
  }

  // 3. Ensure the expected user ID exists
  if (!decoded || typeof decoded.id !== "string" || !decoded.id) {
    return res.status(401).json({
      message: "Not authorized, invalid token payload",
    });
  }

  try {
    // 4. Load fresh user data from database
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    // 5. Reject inactive or pending accounts
    if (user.status !== "active") {
      return res.status(403).json({
        message: "Account is not active",
      });
    }

    // 6. Use current database user for authorization
    req.user = user;

    return next();
  } catch (error) {
    // Database/server errors go to Express error handler
    return next(error);
  }
};

// Owner-only role check
const owner = (req, res, next) => {
  if (req.user?.role === "owner") {
    return next();
  }

  return res.status(403).json({
    message: "Not authorized as owner",
  });
};

// Owner or manager role check
const ownerOrManager = (req, res, next) => {
  if (req.user && ["owner", "manager"].includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({
    message: "Not authorized as owner or manager",
  });
};

module.exports = {
  protect,
  owner,
  ownerOrManager,
};
