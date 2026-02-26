export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // seconds
}

export interface JwtPayload {
    sub: string;       // user ID
    email: string;
    iat: number;
    exp: number;
}

export interface AuthUser {
    id: string;
    email: string;
    displayName: string;
    tenantIds: string[];
    roles: { tenantId: string; role: string }[];
}
