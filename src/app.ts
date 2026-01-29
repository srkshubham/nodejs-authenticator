import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import adminRouter from "./routes/admin.routes";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(helmet);

app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

app.get("/", (_req, res) => {
  res.send("Backend is live 🚀");
});

app.use(
  "/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  })
);
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/admin", adminRouter);

export default app;
