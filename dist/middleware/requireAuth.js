"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../lib/token");
const user_model_1 = require("../models/user.model");
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "you are not authorised user!",
        });
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = (0, token_1.verifyAccessToken)(token);
        const user = await user_model_1.User.findById(payload.sub);
        if (!user) {
            return res.status(401).json({
                message: "User not found.",
            });
        }
        if (user.tokenVersion != payload.tokenVersion) {
            return res.status(401).json({
                message: "Token invalidated.",
            });
        }
        const authReq = req;
        authReq.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
        };
        next();
    }
    catch (error) {
        console.error(error);
        return res.status(401).json({
            message: "invalid Token.",
        });
    }
};
exports.default = requireAuth;
