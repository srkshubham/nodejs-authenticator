"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
dotenv_1.default.config();
const Port = process.env.PORT || 3000;
const startServer = async () => {
    await (0, db_1.default)();
    const server = http_1.default.createServer(app_1.default);
    server.listen(Port, () => {
        console.log(`Server is running on port: ${Port}`);
    });
};
startServer().catch((err) => {
    console.error("Error while starting the server", err);
    process.exit(1);
});
