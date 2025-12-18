import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { type User } from '../services/api';
import { decodeJWT } from '../utils/jwtDecode';

/**
 * Hook to get current user from JWT token
 * Extracts user info directly from token - no API call needed!
 */
export function useCurrentUser() {
  const { authToken } = useAppStore();

  const user = useMemo(() => {
    if (!authToken) {
      return null;
    }

    try {
      const payload = decodeJWT(authToken);
      if (!payload || !payload.sub) {
        console.error('Invalid JWT payload - missing user ID');
        return null;
      }

      // Extract user info from JWT claims
      // If custom claims are missing, use defaults
      const userData: User = {
        id: payload.sub,
        name: payload.name || 'User',
        email: payload.email || '',
        role: payload.role || 'buyer',
        avatar: payload.avatar || null,
        seller_status: payload.seller_status || null,
        is_active: payload.is_active ?? true,
        // Optional fields that might not be in token
        phone: null,
        seller_approved: payload.seller_status === 'approved',
        seller_requested_at: null,
        created_at: null,
        updated_at: null,
      };

      return userData;
    } catch (error) {
      console.error('Error parsing token - please login again:', error);
      return null;
    }
  }, [authToken]);

  return {
    user,
    loading: false, // No loading since we decode synchronously
    isAuthenticated: !!authToken
  };
}
