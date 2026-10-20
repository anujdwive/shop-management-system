const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide name"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Please provide email"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Please provide password"],
      minlength: 6,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["owner", "manager", "worker"],
      default: "worker",
    },

    // Shops assigned to this manager or worker
    shops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
      },
    ],

    // Owner responsible for this team member.
    // Owner accounts can leave this field empty.
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Manager this worker reports to.
    // Usually applicable to worker accounts.
    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Account access status
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // Invitation lifecycle
    invitationStatus: {
      type: String,
      enum: ["not_required", "pending", "accepted"],
      default: "not_required",
    },

    // Store only the hashed invitation token
    invitationTokenHash: {
      type: String,
      select: false,
    },

    invitationExpiresAt: {
      type: Date,
      select: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

// Update timestamp before saving
userSchema.pre("save", function () {
  this.updatedAt = new Date();
});

// Helpful indexes for team queries
userSchema.index({ ownerId: 1, role: 1, status: 1 });
userSchema.index({ reportsTo: 1 });
userSchema.index({ shops: 1 });

module.exports = mongoose.model("User", userSchema);
