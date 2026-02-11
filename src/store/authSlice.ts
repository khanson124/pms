import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole, LoginCredentials, AuthResponse } from '../types/auth';
import authService from '../services/authService';
import { stopInactivityTracking } from '../utils/inactivityTracker';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

// Rehydrate minimal auth state from localStorage so role-gated UI (e.g., Admin Settings)
// is immediately available after refresh. We persist `auth_user` at login.
let hydratedUser: User | null = null;
try {
    // Prefer sessionStorage (active session) then localStorage fallback
    const rawSession = sessionStorage.getItem('auth_user');
    const rawLocal = localStorage.getItem('auth_user');
    const raw = rawSession || rawLocal;
    hydratedUser = raw ? (JSON.parse(raw) as User) : null;
    // Fallback: legacy userProfile shape used elsewhere
    if (!hydratedUser) {
        const legacy = localStorage.getItem('userProfile');
        if (legacy) {
            const lp = JSON.parse(legacy);
            hydratedUser = {
                id: lp.id,
                email: lp.email,
                full_name: lp.name || lp.email,
                department_id: lp.department?.id,
                department_name: lp.department?.name,
                status: 'active',
                roles: lp.roles || (lp.primaryRole ? [lp.primaryRole] : []),
                last_login_at: undefined,
                created_at: undefined,
                updated_at: undefined,
            };
        }
    }
} catch {
    hydratedUser = null;
}

const initialState: AuthState = {
    user: hydratedUser,
    token: null,
    // Consider user authenticated if a user snapshot is cached
    isAuthenticated: !!hydratedUser,
    isLoading: false,
    error: null,
};

// Async thunks
export const loginUser = createAsyncThunk('auth/login', async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
        const response = await authService.login(credentials);
        if (response.success && response.user) {
            return response;
        } else {
            return rejectWithValue(response.message || 'Login failed');
        }
    } catch (error: any) {
        return rejectWithValue(error.message || 'Login failed');
    }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
    stopInactivityTracking();
    return null;
});

export const verifyToken = createAsyncThunk('auth/verifyToken', async (_, { rejectWithValue }) => {
    try {
        const response = await authService.verifyToken();
        if (!response.success) {
            return rejectWithValue(response.message || 'Authentication required');
        }
        return response;
    } catch (error: any) {
        return rejectWithValue(error.message || 'Token verification failed');
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login cases
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user!;
                state.token = action.payload.token ?? null;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
            })
            // Logout cases
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.error = null;
            })
            // Token verification cases
            .addCase(verifyToken.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(verifyToken.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload.success && action.payload.user) {
                    state.user = action.payload.user;
                    state.isAuthenticated = true;
                }
                // If verification succeeds with no user, maintain existing state
                // (This handles graceful degradation for network errors)
            })
            .addCase(verifyToken.rejected, (state) => {
                state.isLoading = false;
                // Don't immediately clear auth state on rejection
                // Let the component logic handle when to actually log out
                // This prevents premature logout on temporary network issues
            });
    },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;

// Selectors
const EMPTY_ROLES: User['roles'] = [];
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectUserRoles = (state: { auth: AuthState }) => state.auth.user?.roles ?? EMPTY_ROLES;
export const selectPrimaryUserRole = (state: { auth: AuthState }) => state.auth.user?.roles?.[0];
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
