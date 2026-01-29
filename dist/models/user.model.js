"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    name: {
        type: String,
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false,
    },
    twoFactorSecret: {
        type: String,
        default: undefined,
    },
    tokenVersion: {
        type: Number,
        default: 0,
    },
    resetPasswordToken: {
        type: String,
        default: undefined,
    },
    resetPasswordExpires: {
        type: Date,
        default: undefined,
    },
}, {
    timestamps: true,
});
exports.User = (0, mongoose_1.model)("User", userSchema);
