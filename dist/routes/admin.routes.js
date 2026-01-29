"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireAuth_1 = __importDefault(require("../middleware/requireAuth"));
const requireRole_1 = __importDefault(require("../middleware/requireRole"));
const user_model_1 = require("../models/user.model");
const router = (0, express_1.Router)();
router.get("/users", requireAuth_1.default, (0, requireRole_1.default)("admin"), async (_req, res) => {
    try {
        const users = await user_model_1.User.find({}, {
            email: 1,
            role: 1,
            isEmailVerified: 1,
            createdAt: 1,
        }).sort({ createdAt: -1 });
        const result = users.map((u) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            isEmailVerified: u.isEmailVerified,
            createdAt: u.createdAt,
        }));
        return res.json({
            users: result,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error.",
        });
    }
});
exports.default = router;
