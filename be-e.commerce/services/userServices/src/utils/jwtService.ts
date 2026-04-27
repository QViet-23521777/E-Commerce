import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
}

export class JwtService {
  private static readonly accessSecret = process.env.JWT_SECRET!;
  private static readonly refreshSecret = process.env.JWT_REFRESH_SECRET!;
  private static readonly accessExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
  private static readonly refreshExpiresIn =
    process.env.JWT_REFRESH_EXPIRES_IN || "7d";

  // ✅ Dùng khi login / register
  static generateTokenPair(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn as any,
    });
    const refreshToken = jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn as any,
    });
    return { accessToken, refreshToken };
  }

  // ✅ Dùng khi refresh token
  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn as any,
    });
  }

  // ✅ Dùng khi refresh token — verify refresh token
  static verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.refreshSecret) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("TOKEN_EXPIRED");
      }
      throw new Error("INVALID_TOKEN");
    }
  }

  // ✅ Dùng khi reset password
  static generateResetPasswordToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: "1h",
    });
  }

  static verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.accessSecret) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("TOKEN_EXPIRED");
      }
      throw new Error("INVALID_TOKEN");
    }
  }
}
