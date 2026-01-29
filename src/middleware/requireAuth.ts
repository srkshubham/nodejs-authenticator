import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/token";
import { User } from "../models/user.model";

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "you are not authorised user!",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub);
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

    const authReq = req as any;

    authReq.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      message: "invalid Token.",
    });
  }
};

export default requireAuth;
