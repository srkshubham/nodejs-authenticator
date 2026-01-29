"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandler = registerHandler;
exports.verifyEmailHandler = verifyEmailHandler;
exports.loginHandler = loginHandler;
exports.refreshHandler = refreshHandler;
exports.logoutHandler = logoutHandler;
exports.forgotPasswordHandler = forgotPasswordHandler;
exports.resetPasswordHandler = resetPasswordHandler;
exports.googleAuthStartHandler = googleAuthStartHandler;
exports.googleAuthCallbackHandler = googleAuthCallbackHandler;
exports.twoFASetupHandler = twoFASetupHandler;
exports.twoFAVerifyHandler = twoFAVerifyHandler;
const auth_schema_1 = require("./auth.schema");
const user_model_1 = require("../../models/user.model");
const hash_1 = require("../../lib/hash");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_1 = require("../../lib/email");
const token_1 = require("../../lib/token");
const crypto_1 = __importDefault(require("crypto"));
const google_auth_library_1 = require("google-auth-library");
const preset_v11_1 = require("@otplib/preset-v11");
function getAppUrl() {
    return process.env.APP_URL || `http://localhost:${process.env.PORT}`;
}
function getGoogleClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret) {
        throw new Error("Google client id or secret both are missing");
    }
    return new google_auth_library_1.OAuth2Client({
        clientId,
        clientSecret,
        redirectUri,
    });
}
async function registerHandler(req, res) {
    try {
        const result = auth_schema_1.registerSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Invalid data!",
                errors: result.error.flatten(),
            });
        }
        const { name, email, password } = result.data;
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await user_model_1.User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                message: "Email is already in use! Please try with a different email",
            });
        }
        const passwordHash = await (0, hash_1.hashPassword)(password);
        const newlyCreatedUser = await user_model_1.User.create({
            name,
            email: normalizedEmail,
            passwordHash,
            role: "user",
            isEmailVerified: false,
            twoFactorEnabled: false,
        });
        // email verification part
        const verifyToken = jsonwebtoken_1.default.sign({ sub: newlyCreatedUser.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "1d" });
        const verifyUrl = `${getAppUrl()}/auth/verify-email?token=${verifyToken}`;
        await (0, email_1.sendEmail)(newlyCreatedUser.email, "Verify your Email", `
      <p>Please verify your email by clicking this link:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      `);
        return res.status(201).json({
            message: "User registered",
            user: {
                id: newlyCreatedUser.id,
                email: newlyCreatedUser.email,
                role: newlyCreatedUser.role,
                isEmailVerified: newlyCreatedUser.isEmailVerified,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error.",
        });
    }
}
async function verifyEmailHandler(req, res) {
    const token = req.query.token || undefined;
    if (!token) {
        return res.status(400).json({
            message: "Verification token is missing.",
        });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await user_model_1.User.findById(payload.sub);
        if (!user) {
            return res.status(400).json({
                message: "User not found.",
            });
        }
        if (user.isEmailVerified) {
            return res.json({ message: "Email is already verified." });
        }
        user.isEmailVerified = true;
        await (user === null || user === void 0 ? void 0 : user.save());
        return res.json({
            message: "Email is now verified! You can login.",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error.",
        });
    }
}
async function loginHandler(req, res) {
    try {
        const result = auth_schema_1.loginSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Invalid data.",
                error: result.error.flatten,
            });
        }
        const { email, password, twoFactorCode } = result.data;
        const normalizedEmail = email.toLowerCase().trim();
        const user = await user_model_1.User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({
                message: "User not found.",
            });
        }
        const ok = await (0, hash_1.checkPassword)(password, user.passwordHash);
        if (!ok) {
            return res.status(400).json({
                message: "Invalid password.",
            });
        }
        if (!user.isEmailVerified) {
            return res.status(403).json({
                message: "Please verify your email before logging in...",
            });
        }
        if (user.twoFactorEnabled) {
            if (!twoFactorCode || typeof twoFactorCode !== "string") {
                return res.status(400).json({
                    message: "Two factor code is required.",
                });
            }
            if (!user.twoFactorSecret) {
                return res.status(400).json({
                    message: "Two factor misconfigured for this account.",
                });
            }
            // verify code using otplib
            const isValidCode = preset_v11_1.authenticator.check(twoFactorCode, user.twoFactorSecret);
            if (!isValidCode) {
                return res.status(400).json({
                    message: "Invalid two factor code.",
                });
            }
        }
        const accessToken = (0, token_1.createAccessToken)(user.id, user.role, user.tokenVersion);
        const refreshToken = (0, token_1.createRefreshToken)(user.id, user.tokenVersion);
        const isProd = process.env.NODE_ENV === "production";
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
            message: "Login successfully done.",
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                twoFactorEnabled: user.twoFactorEnabled,
            },
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
        });
    }
}
async function refreshHandler(req, res) {
    var _a;
    try {
        const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        if (!token) {
            return res.status(401).json({ message: "Refresh token missing." });
        }
        const payload = (0, token_1.verifyRefreshToken)(token);
        const user = await user_model_1.User.findById(payload.sub);
        if (!user) {
            return res.status(401).json({ message: "User not found." });
        }
        if (user.tokenVersion != payload.tokenVersion) {
            return res.status(401).json({ message: "Refresh token invalid." });
        }
        const newAccessToken = (0, token_1.createAccessToken)(user.id, user.role, user.tokenVersion);
        const newRefreshToken = (0, token_1.createRefreshToken)(user.id, user.tokenVersion);
        const isProd = process.env.NODE_ENV === "production";
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
            message: "Token refreshed",
            accessToken: newAccessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                twoFactorEnabled: user.twoFactorEnabled,
            },
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
        });
    }
}
async function logoutHandler(_req, res) {
    res.clearCookie("refreshToken", { path: "/" });
    return res.status(200).json({
        message: "Logged out successfully.",
    });
}
async function forgotPasswordHandler(req, res) {
    const { email } = req.body;
    console.log(email);
    if (!email) {
        return res.status(400).json({
            message: "Email is required.",
        });
    }
    const normalizedEmail = email === null || email === void 0 ? void 0 : email.toLowerCase().trim();
    try {
        const user = await user_model_1.User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.json({
                message: "if account exist with this mail, we will send you a reset link.",
            });
        }
        const rawToken = crypto_1.default.randomBytes(32).toString("hex");
        const tokenHash = crypto_1.default
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");
        user.resetPasswordToken = tokenHash;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        const resetUrl = `${getAppUrl()}/auth/reset-password?token=${rawToken}`;
        await (0, email_1.sendEmail)(user.email, "Reset your password", `
      <p>You requested password reset. Click on the below link to reset:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      `);
        return res.json({
            message: "if account exist with this mail, we will send you a reset link.",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
        });
    }
}
async function resetPasswordHandler(req, res) {
    const { token, password } = req.body;
    if (!token) {
        return res.status(400).json({
            message: "Reset token is missing.",
        });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({
            message: "Password must be atleast 6 char long.",
        });
    }
    try {
        const tokenHash = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const user = await user_model_1.User.findOne({
            resetPasswordToken: tokenHash,
            resetPasswordExpires: { $gt: new Date() },
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }
        const newPasswordHash = await (0, hash_1.hashPassword)(password);
        user.passwordHash = newPasswordHash;
        user.resetPasswordExpires = undefined;
        user.resetPasswordToken = undefined;
        user.tokenVersion += 1;
        await user.save();
        return res.status(200).json({
            message: "Password Reset Successfully.",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
        });
    }
}
async function googleAuthStartHandler(_req, res) {
    try {
        const client = getGoogleClient();
        const url = client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: ["openid", "email", "profile"],
        });
        return res.redirect(url);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
        });
    }
}
async function googleAuthCallbackHandler(req, res) {
    const code = req.query.code;
    if (!code) {
        return res.status(400).json({
            message: "Missing code in callback.",
        });
    }
    try {
        const client = getGoogleClient();
        const { tokens } = await client.getToken(code);
        if (!tokens.id_token) {
            return res.status(400).json({
                message: "No googles id_token is present.",
            });
        }
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload === null || payload === void 0 ? void 0 : payload.email;
        const emailVerified = payload === null || payload === void 0 ? void 0 : payload.email_verified;
        if (!email || !emailVerified) {
            return res.status(400).json({
                message: "Google email account it not verified.",
            });
        }
        const normalizedEmail = email.toLowerCase().trim();
        let user = await user_model_1.User.findOne({ email: normalizedEmail });
        if (!user) {
            const randomPassword = crypto_1.default.randomBytes(16).toString("hex");
            const passwordHash = await (0, hash_1.hashPassword)(randomPassword);
            user = await user_model_1.User.create({
                email: normalizedEmail,
                passwordHash,
                role: "user",
                isEmailVerified: true,
                twoFactorEnabled: false,
            });
            // return res.status(400).json({
            //   message: "User not found.",
            // });
        }
        else {
            if (!user.isEmailVerified) {
                user.isEmailVerified = true;
                await user.save();
            }
        }
        const accessToken = (0, token_1.createAccessToken)(user.id, user.role, user.tokenVersion);
        const refreshToken = (0, token_1.createRefreshToken)(user.id, user.tokenVersion);
        const isProd = process.env.NODE_ENV === "production";
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.json({
            message: "Google login successfully.",
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
}
async function twoFASetupHandler(req, res) {
    const authReq = req;
    const authUser = authReq.user;
    if (!authUser) {
        return res.status(401).json({
            message: "Not authenticated",
        });
    }
    try {
        const user = await user_model_1.User.findById(authUser.id);
        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }
        const secret = preset_v11_1.authenticator.generateSecret();
        const issuer = "nodejs-authenticator";
        const otpAuthUrl = preset_v11_1.authenticator.keyuri(user.email, issuer, secret);
        user.twoFactorSecret = secret;
        user.twoFactorEnabled = false;
        await user.save();
        return res.json({
            message: "2FA setup is done",
            otpAuthUrl,
            secret,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error ",
        });
    }
}
async function twoFAVerifyHandler(req, res) {
    const authReq = req;
    const authUser = authReq.user;
    if (!authUser) {
        return res.status(401).json({
            message: "Not authenticated",
        });
    }
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({
            message: "Two factor code is required.",
        });
    }
    try {
        const user = await user_model_1.User.findById(authUser.id);
        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }
        if (!user.twoFactorSecret) {
            return res.status(400).json({
                message: "You do not have 2fa setup yet.",
            });
        }
        const isvalid = preset_v11_1.authenticator.check(code, user.twoFactorSecret);
        if (!isvalid) {
            return res.status(400).json({
                message: "Invalid 2fa code.",
            });
        }
        user.twoFactorEnabled = true;
        await user.save();
        return res.json({
            message: "2FA setup is done",
            twoFactorEnabled: true,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error ",
        });
    }
}
