"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccessToken = createAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.createRefreshToken = createRefreshToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function createAccessToken(userId, role, tokenVersion) {
    const payload = { sub: userId, role, tokenVersion };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "30m",
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
}
function createRefreshToken(userId, tokenVersion) {
    const payload = { sub: userId, tokenVersion };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "7d",
    });
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
}
