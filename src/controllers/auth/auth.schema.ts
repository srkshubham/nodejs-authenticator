import z from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(3, "Name is required"),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
  twoFactorCode: z.string().optional(),
});
