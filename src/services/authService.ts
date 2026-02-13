// Client-side auth service: use real backend API
import { LoginCredentials, AuthResponse } from '../types/auth';
import mockAuthService from './mockAuthService';
import { getApiUrl } from '../config/api';
import { clearAuth, getUser, isRemembered, setAuth } from '../utils/auth';

// Use mock auth in development if VITE_USE_MOCK_AUTH is true
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
// Switchable auth mode (LOCAL | AAD); default LOCAL to avoid breaking current setup
const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || 'LOCAL') as 'LOCAL' | 'AAD';

class AuthService {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        // Prevent accidental password login in AAD mode (non-breaking stub)
        if (AUTH_MODE === 'AAD') {
            return {
                success: false,
                message: 'Password login disabled: Azure AD mode active (stub). Use SSO button.',
            };
        }
        // Use mock service if enabled in environment
        if (USE_MOCK_AUTH) {
            const result = await mockAuthService.login(credentials);
            if (result.success && result.token) {
                localStorage.setItem('token', result.token);
            }
            return result;
        }

        // Use real backend API
        try {
            // Normalize email to lowercase before sending
            const normalizedCredentials = {
                ...credentials,
                email: credentials.email.toLowerCase().trim(),
            };

            const response = await fetch(getApiUrl('/api/auth/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(normalizedCredentials),
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    message: errorText || 'Login failed',
                };
            }

            const data = await response.json();

            // Persist user snapshot for downstream services (adminService, etc.)
            try {
                if (data.user) {
                    setAuth('', data.user, Boolean((credentials as any).rememberMe));
                }
            } catch {}

            // Transform backend user to frontend User type
            const user = data.user
                ? {
                      id: data.user.id,
                      email: data.user.email,
                      full_name: data.user.name || data.user.email,
                      status: 'active' as const,
                      roles: data.user.roles || [],
                      department_id: data.user.department?.id,
                      department_name: data.user.department?.name,
                  }
                : undefined;

            return {
                success: true,
                user,
                token: data.token,
                message: 'Login successful',
            };
        } catch (error) {
            // Provide user-friendly error messages for network issues
            let errorMessage = 'Network error';

            if (error instanceof TypeError && error.message.includes('fetch')) {
                errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
            } else if (error instanceof Error) {
                // Check for common network error patterns
                const msg = error.message.toLowerCase();
                if (msg.includes('failed to fetch') || msg.includes('network request failed')) {
                    errorMessage = 'Connection failed. Please check your internet connection and ensure the server is running.';
                } else if (msg.includes('timeout')) {
                    errorMessage = 'Connection timeout. Please check your internet connection and try again.';
                } else {
                    errorMessage = error.message;
                }
            }

            return {
                success: false,
                message: errorMessage,
            };
        }
    }

    async verifyToken(token?: string): Promise<AuthResponse> {
        if (USE_MOCK_AUTH) {
            const t = token || localStorage.getItem('token');
            if (!t) return { success: false, message: 'No authentication token found' };
            return mockAuthService.verifyToken(t);
        }
        try {
            const response = await fetch(getApiUrl('/api/auth/me'), {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Only treat 401/403 as auth failure - other errors might be temporary
            if (response.status === 401 || response.status === 403) {
                return { success: false, message: 'Authentication required' };
            }

            if (!response.ok) {
                // Server error or network issue - don't clear auth state
                return { success: true, message: 'Verification skipped due to server error' };
            }

            const data = await response.json().catch(() => ({}));

            if (data.user) {
                setAuth('', data.user, isRemembered());
            }

            const user = data.user
                ? {
                      id: data.user.id,
                      email: data.user.email,
                      full_name: data.user.name || data.user.email,
                      status: 'active' as const,
                      roles: data.user.roles || [],
                      department_id: data.user.department?.id,
                      department_name: data.user.department?.name,
                  }
                : undefined;

            return { success: true, message: 'Token valid', user };
        } catch (error) {
            // Network error - don't clear auth state, user might be temporarily offline
            return { success: true, message: 'Verification skipped due to network error' };
        }
    }

    async logout(): Promise<void> {
        if (USE_MOCK_AUTH) {
            await mockAuthService.logout();
        }
        try {
            await fetch(getApiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
        } catch {}
        clearAuth();
    }

    async refreshToken(): Promise<AuthResponse> {
        if (USE_MOCK_AUTH) {
            return mockAuthService.refreshToken();
        }

        // Implement real token refresh endpoint
        try {
            const response = await fetch(getApiUrl('/api/auth/refresh'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    message: errorText || 'Token refresh failed',
                };
            }

            const data = await response.json();

            // Update cached user data
            if (data.user) {
                setAuth('', data.user, isRemembered());
            }

            // Transform backend user to frontend User type
            const user = data.user
                ? {
                      id: data.user.id,
                      email: data.user.email,
                      full_name: data.user.name || data.user.email,
                      status: 'active' as const,
                      roles: data.user.roles || [],
                      department_id: data.user.department?.id,
                      department_name: data.user.department?.name,
                  }
                : undefined;

            return {
                success: true,
                user,
                token: data.token,
                message: 'Token refreshed successfully',
            };
        } catch (error: any) {
            console.error('Token refresh error:', error);
            clearAuth();
            return {
                success: false,
                message: error.message || 'Token refresh failed',
            };
        }
    }

    getAuthHeaders(): Record<string, string> {
        if (USE_MOCK_AUTH) {
            return mockAuthService.getAuthHeaders();
        }
        return {};
    }

    isAuthenticated(): boolean {
        if (USE_MOCK_AUTH) {
            return mockAuthService.isAuthenticated();
        }
        return !!getUser();
    }
}

export default new AuthService();
