"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.checkPassword = checkPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function hashPassword(passowrd) {
    const salt = await bcryptjs_1.default.genSalt();
    const hash = await bcryptjs_1.default.hash(passowrd, salt);
    return hash;
}
async function checkPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
