/**
 * Global Inactivity & Session Expiration Tracker
 * Monitors user activity and manages auto-logout
 */

import Swal from 'sweetalert2';
import { clearAuth, getUser } from './auth';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes (increased from 15 for procurement workflows)
let inactivityTimer: NodeJS.Timeout | null = null;
let expirationCheckTimer: NodeJS.Timeout | null = null;
let lastActivityTime = Date.now();
let warningShown = false;

/**
 * Handle session logout
 */
async function handleSessionExpired() {
    stopInactivityTracking();

    await Swal.fire({
        title: 'Session Expired',
        text: 'Your session has expired. Please log in again.',
        icon: 'warning',
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText: 'Log In',
    });

    clearAuth();
    window.location.href = '/auth/login';
}

/**
 * Show token expiration warning
 */

/**
 * Reset inactivity timer on user activity
 */
function resetInactivityTimer() {
    lastActivityTime = Date.now();
    warningShown = false; // Reset warning flag on activity

    // Clear existing timer
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }

    // Set new timer
    inactivityTimer = setTimeout(() => {
        handleSessionExpired();
    }, INACTIVITY_TIMEOUT);
}

/**
 * Check token expiration periodically
 */
function startExpirationCheck() {
    // Delay first check by 5 seconds to allow cookies to settle after login
    setTimeout(() => {
        expirationCheckTimer = setInterval(async () => {
            if (!getUser()) {
                stopInactivityTracking();
                return;
            }

            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });

                // Only log out on explicit auth failure (401/403)
                // Ignore other errors as they might be temporary network issues
                if (res.status === 401 || res.status === 403) {
                    handleSessionExpired();
                }
            } catch (error) {
                // Ignore transient network errors
            }
        }, 60000); // Check every 60 seconds
    }, 5000); // Wait 5 seconds before starting periodic checks
}

/**
 * Start tracking inactivity and session expiration
 */
export function startInactivityTracking() {
    if (!getUser()) return;

    lastActivityTime = Date.now();
    warningShown = false;

    // Add activity listeners
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
        resetInactivityTimer();
    };

    activityEvents.forEach((event) => {
        document.addEventListener(event, handleActivity, { passive: true });
    });

    // Reset initial timer
    resetInactivityTimer();

    // Start expiration check
    startExpirationCheck();

    // Store cleanup function
    (window as any).__stopInactivityTracking = () => {
        activityEvents.forEach((event) => {
            document.removeEventListener(event, handleActivity);
        });
    };
}

/**
 * Stop tracking inactivity
 */
export function stopInactivityTracking() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }

    if (expirationCheckTimer) {
        clearInterval(expirationCheckTimer);
        expirationCheckTimer = null;
    }

    // Remove event listeners
    const cleanup = (window as any).__stopInactivityTracking;
    if (cleanup) cleanup();

    warningShown = false;
}

/**
 * Reset activity (call when user performs an action)
 */
export function resetActivity() {
    resetInactivityTimer();
}

/**
 * Get minutes until session expires
 */
export function getMinutesUntilExpiry(): number {
    return 0;
}
