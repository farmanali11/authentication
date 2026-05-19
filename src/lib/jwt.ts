import jwt, { TokenExpiredError } from "jsonwebtoken";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
  type: "access" | "refresh";
}

const getAccessSecret = () => {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s) {
    throw new Error(
      "JWT_ACCESS_SECRET is not defined. Add it to your .env.local file.",
    );
  }
  return s;
};

const getRefreshSecret = () => {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) {
    throw new Error(
      "JWT_REFRESH_SECRET is not defined. Add it to your .env.local file.",
    );
  }
  return s;
};

export function signAccessToken(payload: Omit<JWTPayload, "type">): string {
  return jwt.sign(
    {
      ...payload,
      type: "access",
    },
    getAccessSecret(),
    {
      expiresIn: "15m",

      issuer: "nextauth-app",
      audience: "nextauth-client",
    },
  );
}

export function signRefreshToken(payload: Omit<JWTPayload, "type">): string {
  return jwt.sign(
    {
      ...payload,
      type: "refresh",
    },
    getRefreshSecret(),
    {
      expiresIn: "7d",
      issuer: "nextauth-app",
      audience: "nextauth-client",
    },
  );
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getAccessSecret(), {
      issuer: "nextauth-app",
      audience: "nextauth-client",
    }) as JWTPayload;

    if (decoded.type !== "access") {
      return null;
    }

    return decoded;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return null;
    }
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getRefreshSecret(), {
      issuer: "nextauth-app",
      audience: "nextauth-client",
    }) as JWTPayload;
    if (decoded.type !== "refresh") {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export const refreshCookieOptions = {
  name: "refreshToken",
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  },
} as const;
