"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendEmail(to, subject, html) {
    if (!process.env.SMTP_HOST ||
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASS) {
        // console.log("Email envs are not available.");
        return;
    }
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_EMAIL_FROM;
    const transporter = nodemailer_1.default.createTransport({
        host,
        port,
        secure: false, // Use true for port 465, false for port 587
        auth: {
            user,
            pass,
        },
    });
    // Send an email using async/await
    await transporter.sendMail({
        from,
        to,
        subject,
        html,
    });
}
