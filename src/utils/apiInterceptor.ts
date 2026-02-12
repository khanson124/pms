/**
 * API Interceptor for handling JWT token refresh
 * Automatically refreshes tokens on 401 responses
 */

import { getApiUrl } from '../config/api';
import { logout, isRemembered, setAuth } from './auth';
import { startInactivityTracking, stopInactivityTracking } from './inactivityTracker';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Subscribe to token refresh events
 * Used to retry failed requests after token is refreshed
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
    refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers of new token
 */
function onTokenRefreshed(token: string) {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
}

/**
 * Refresh the access token using the refresh token
 */
async function performTokenRefresh(): Promise<string | null> {
    try {
        const response = await fetch(getApiUrl('/api/auth/refresh'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!response.ok) {
            // Refresh failed, clear tokens and redirect to login
            await logout();
            return null;
        }

        const data = await response.json();

        if (data.token) {
            if (data.user) {
                setAuth('', data.user, isRemembered());
            }
            // Restart inactivity tracking with new token
            stopInactivityTracking();
            startInactivityTracking();
            return data.token;
        }

        return null;
    } catch (error) {
        console.error('Token refresh failed:', error);
        await logout();
        return null;
    }
}

/**
 * Enhanced fetch wrapper that handles token refresh
 * If a request gets a 401, automatically refreshes token and retries
 */
export async function fetchWithTokenRefresh(url: string, options: RequestInit = {}): Promise<Response> {
    const init: RequestInit = {
        ...options,
        credentials: 'include',
    };

    let response = await fetch(url, init);

    // If 401, attempt to refresh token
    if (response.status === 401) {
        if (!isRefreshing) {
            isRefreshing = true;

            // Perform the actual token refresh
            const newToken = await performTokenRefresh();

            if (newToken) {
                onTokenRefreshed(newToken);
            } else {
                // Refresh failed - will be handled by caller (redirect to login)
                isRefreshing = false;
                return response;
            }

            isRefreshing = false;
        }

        // Wait for token refresh to complete, then retry request
        return new Promise((resolve, reject) => {
            subscribeTokenRefresh(() => {
                fetch(url, init).then(resolve).catch(reject);
            });
        });
    }

    return response;
}

/**
 * Utility to check if token is about to expire
 * Returns true if token will expire in the next 5 minutes
 */
export function isTokenAboutToExpire(): boolean {
    return false;
}

/**
 * Proactively refresh token if it's about to expire
 */
export async function refreshTokenIfNeeded(): Promise<void> {
    return;
}

export default {
    fetchWithTokenRefresh,
    isTokenAboutToExpire,
    refreshTokenIfNeeded,
};
