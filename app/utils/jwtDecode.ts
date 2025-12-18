/**
 * JWT Decode Utility
 * Decode JWT token and extract user information
 */

export interface JWTPayload {
  sub: number;  // User ID
  iat: number;  // Issued at
  exp: number;  // Expiration
  nbf: number;  // Not before
  // Custom claims from Laravel JWT
  role?: string;
  name?: string;
  email?: string;
  avatar?: string | null;
  seller_status?: string | null;
  is_active?: boolean;
}

/**
 * Decode JWT token and extract payload
 * JWT format: header.payload.signature
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    // Split token into parts
    const parts = token.split('.');

    if (parts.length !== 3) {
      console.error('Invalid JWT format - expected 3 parts, got', parts.length);
      return null;
    }

    // Decode the payload (second part)
    let payload = parts[1];

    // Replace URL-safe characters
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed (base64 requires length to be multiple of 4)
    while (payload.length % 4 !== 0) {
      payload += '=';
    }

    // Decode base64
    const decoded = atob(payload);

    // Parse JSON
    const parsed = JSON.parse(decoded);

    return parsed;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isJWTExpired(token: string): boolean {
  const payload = decodeJWT(token);

  if (!payload || !payload.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Get user ID from JWT token
 */
export function getUserIdFromToken(token: string): number | null {
  const payload = decodeJWT(token);
  return payload?.sub || null;
}
