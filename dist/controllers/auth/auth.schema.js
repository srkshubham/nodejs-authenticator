"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.registerSchema = zod_1.default.object({
    email: zod_1.default.email(),
    password: zod_1.default.string().min(6, "Password must be at least 6 characters"),
    name: zod_1.default.string().min(3, "Name is required"),
});
exports.loginSchema = zod_1.default.object({
    email: zod_1.default.email(),
    password: zod_1.default.string(),
    twoFactorCode: zod_1.default.string().optional(),
});
