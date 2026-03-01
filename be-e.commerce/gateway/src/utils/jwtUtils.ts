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

  static generateToken(
    payload: JwtPayload,
    secret: string,
    expiresIn: string | number = "7d",
  ): string {
    return jwt.sign(payload, secret, {
      expiresIn: expiresIn as any,
    });
  }

  static generateRefreshToken(
    payload: JwtPayload,
    secret: string,
    expiresIn: string | number = "30d",
  ): string {
    return jwt.sign(payload, secret, {
      expiresIn: expiresIn as any,
    });
  }

  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  static refreshToken(
    oldToken: string,
    secret: string,
    newExpiresIn: string | number = "7d",
  ): string {
    const payload = this.verifyToken(oldToken, secret);

    const { userId, email, role } = payload;
    return this.generateToken({ userId, email, role }, secret, newExpiresIn);
  }

  static isTokenValid(token: string, secret: string): boolean {
    try {
      this.verifyToken(token, secret);
      return true;
    } catch {
      return false;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;

      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  static getUserIdFromToken(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.userId || null;
  }

  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return null;

      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  static getTokenTimeRemaining(token: string): number {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return 0;

      const timeRemaining = decoded.exp - Math.floor(Date.now() / 1000);
      return Math.max(0, timeRemaining);
    } catch {
      return 0;
    }
  }

  static generateTokenPair(
    payload: JwtPayload,
    accessSecret: string,
    refreshSecret: string,
    accessExpiresIn: string | number = "15m",
    refreshExpiresIn: string | number = "7d",
  ): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateToken(payload, accessSecret, accessExpiresIn),
      refreshToken: this.generateRefreshToken(
        payload,
        refreshSecret,
        refreshExpiresIn,
      ),
    };
  }

  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return null;

    return parts[1];
  }

  static compareTokenPayloads(token1: string, token2: string): boolean {
    try {
      const payload1 = this.decodeToken(token1);
      const payload2 = this.decodeToken(token2);

      if (!payload1 || !payload2) return false;

      return (
        payload1.userId === payload2.userId &&
        payload1.email === payload2.email &&
        payload1.role === payload2.role
      );
    } catch {
      return false;
    }
  }
}
