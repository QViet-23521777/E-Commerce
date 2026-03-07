import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
}

export class JwtUtils {
  static verifyToken(token: string, secret: string): JwtPayload {
    try {
      return jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token has expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid token signature");
      }
      throw new Error("Token verification failed");
    }
  }
}
