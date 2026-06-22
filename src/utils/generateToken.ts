import jwt, { SignOptions } from "jsonwebtoken";

function generateToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };

  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, options);
}

export default generateToken;
