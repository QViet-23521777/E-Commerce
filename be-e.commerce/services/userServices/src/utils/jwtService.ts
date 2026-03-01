import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
}

export class JwtService {
  private static ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET || "your_access_secret_key";
  private static REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || "your_refresh_secret_key";
  private static ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
  private static REFRESH_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN || "7d";

  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.ACCESS_SECRET, {
      expiresIn: this.ACCESS_EXPIRES_IN as any,
      issuer: "user-service",
    });
  }

  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_EXPIRES_IN as any,
      issuer: "user-service",
    });
  }
  static generateEmailVerificationToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.ACCESS_SECRET, {
      expiresIn: "24h",
      issuer: "user-service",
    });
  }

  static verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.ACCESS_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Access token has expired");
      }
      throw new Error("Invalid access token");
    }
  }

  static verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.REFRESH_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Refresh token has expired");
      }
      throw new Error("Invalid refresh token");
    }
  }

  static generateTokenPair(payload: JwtPayload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    return { accessToken, refreshToken };
  }

  static generateResetPasswordToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.ACCESS_SECRET, {
      expiresIn: "1h",
      issuer: "user-service",
    });
  }

  static verifyResetPasswordToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.ACCESS_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Reset password token has expired");
      }
      throw new Error("Invalid reset password token");
    }
  }
}
