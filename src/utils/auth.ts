// Centralized auth helpers for token/user storage with optional "remember me"

export type AuthUser = {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
    roles?: string[];
};

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REMEMBER_KEY = 'remember_me';

export function setAuth(_token: string, user: AuthUser, remember: boolean) {
    try {
        // Persist remember flag in localStorage only
        if (remember) localStorage.setItem(REMEMBER_KEY, '1');
        else localStorage.removeItem(REMEMBER_KEY);

        const store = remember ? localStorage : sessionStorage;
        store.setItem(USER_KEY, JSON.stringify(user));

        // Ensure the other store is cleared to avoid stale reads
        const other = remember ? sessionStorage : localStorage;
        other.removeItem(USER_KEY);
    } catch {
        // ignore storage errors
    }
}

export function clearAuth() {
    try {
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(USER_KEY);
        localStorage.removeItem(REMEMBER_KEY);
    } catch {}
}

/**
 * Logout user completely - clears backend cookies AND local auth state
 * Use this instead of clearAuth() when logging out to ensure cookies are cleared
 */
export async function logout(): Promise<void> {
    try {
        // Call backend to clear HTTP-only cookies
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
    } catch {
        // Ignore network errors during logout
    }
    // Clear local auth state
    clearAuth();
}

export function getToken(): string | null {
    return null;
}

export function getUser(): AuthUser | null {
    try {
        // Prefer sessionStorage (active login)
        const sessionRaw = sessionStorage.getItem(USER_KEY);
        if (sessionRaw) return JSON.parse(sessionRaw) as AuthUser;
        const remembered = localStorage.getItem(REMEMBER_KEY) === '1';
        if (remembered) {
            const raw = localStorage.getItem(USER_KEY);
            return raw ? (JSON.parse(raw) as AuthUser) : null;
        }
        // fallback: if remember flag missing but local user exists
        const raw = localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
        return null;
    }
}

export function isRemembered(): boolean {
    try {
        return localStorage.getItem(REMEMBER_KEY) === '1';
    } catch {
        return false;
    }
}

export function isAuthenticated(): boolean {
    return getUser() !== null;
}
