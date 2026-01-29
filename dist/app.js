"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, helmet_1.default)());
app.get("/health", (_req, res) => {
    res.status(200).send("OK");
});
app.get("/", (_req, res) => {
    res.send("Backend is live 🚀");
});
app.use("/auth", (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 100,
}));
app.use("/auth", auth_routes_1.default);
app.use("/user", user_routes_1.default);
app.use("/admin", admin_routes_1.default);
exports.default = app;
