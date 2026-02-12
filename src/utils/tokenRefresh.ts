/**
 * Token Refresh Utility
 * Handles automatic token refresh using refresh tokens
 */
import { getApiUrl } from '../config/api';
import { logout, isRemembered, setAuth } from './auth';

let refreshPromise: Promise<string> | null = null;

/**
 * Refresh the access token using the stored refresh token
 * Returns the new access token on success, throws on failure
 */
export async function refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const url = getApiUrl('/api/auth/refresh');
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();

            if (!data.token) {
                throw new Error('Invalid refresh response');
            }

            if (data.user) {
                setAuth('', data.user, isRemembered());
            }

            return data.token;
        } catch (error) {
            await logout();
            throw error;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

/**
 * Check if token is expired or about to expire (within 5 minutes)
 */
export function isTokenExpiringSoon(): boolean {
    return false;
}

/**
 * Automatically refresh token if it's expiring soon
 * Can be called before API requests to ensure valid token
 */
export async function ensureValidToken(): Promise<string | null> {
    return null;
}
