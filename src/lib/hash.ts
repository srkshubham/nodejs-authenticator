import bcrypt from "bcryptjs";

export async function hashPassword(passowrd: string) {
  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash(passowrd, salt);

  return hash;
}

export async function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
