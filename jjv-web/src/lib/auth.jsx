import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USERS } from './mockData';

const AuthContext = createContext();

export const USERS_STORAGE_KEY = 'jjv_auth_users_v2';
export const SESSION_STORAGE_KEY = 'jjv_auth_session_v2';

/**
 * Standard SHA-256 password hashing via Web Crypto API
 */
export async function hashPassword(plainText) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Crypto.subtle hashing failed, using fallback', e);
    }
  }
  return plainText;
}

/**
 * Retrieves user accounts from persistent storage or initializes with defaults
 */
export function getRegisteredUsers() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(u => u.username)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse registered users store', e);
      }
    }
    // Initialize default accounts
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
    } catch (err) {
      console.warn('Could not initialize USERS_STORAGE_KEY in localStorage', err);
    }
  }
  return [...INITIAL_USERS];
}

export function saveRegisteredUsers(users) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (err) {
      console.warn('Could not save registered users to localStorage due to quota or storage limit', err);
    }
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof localStorage === 'undefined') return null;

    // Check localStorage (Remember Me) or sessionStorage
    let sessionRaw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionRaw && typeof sessionStorage !== 'undefined') {
      sessionRaw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    }

    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        
        // Session expiration verification (e.g. 30-day window)
        if (session.expiresAt && Date.now() > session.expiresAt) {
          console.warn('JJV Auth: Active session expired. Redirecting to login.');
          localStorage.removeItem(SESSION_STORAGE_KEY);
          if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(SESSION_STORAGE_KEY);
          return null;
        }

        // Validate user account in persistent registry
        const users = getRegisteredUsers();
        const verified = users.find((u) => u.id === session.user?.id || u.username === session.user?.username);
        if (verified) {
          return verified;
        }
      } catch (e) {
        console.error('Failed to parse auth session', e);
      }
    }
    return null;
  });

  const [authError, setAuthError] = useState(null);

  /**
   * Manual standard username and password login
   * @param {string} username - 'Rashmi' or 'Nikhil'
   * @param {string} password - 'adminpassword2026' or 'password2026'
   * @param {boolean} rememberMe - 30-day session persistence
   */
  const login = async (username, password, rememberMe = false) => {
    setAuthError(null);
    const cleanUser = (username || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanUser) {
      const err = 'Please enter your username.';
      setAuthError(err);
      return { success: false, error: err };
    }
    if (!cleanPass) {
      const err = 'Please enter your password.';
      setAuthError(err);
      return { success: false, error: err };
    }

    const users = getRegisteredUsers();
    const matchedUser = users.find(
      (u) => (u.username && u.username.toLowerCase() === cleanUser.toLowerCase()) ||
             (u.name && u.name.toLowerCase() === cleanUser.toLowerCase())
    );

    if (!matchedUser) {
      const err = 'Invalid credentials. User does not exist.';
      setAuthError(err);
      return { success: false, error: err };
    }

    const hashedInput = await hashPassword(cleanPass);
    const isPasswordValid =
      matchedUser.passwordHash === hashedInput ||
      matchedUser.password === cleanPass;

    if (!isPasswordValid) {
      const err = 'Incorrect password. Please verify and try again.';
      setAuthError(err);
      return { success: false, error: err };
    }

    // Session Management:
    // Remember Me: 30 days session persistence (30 * 24 * 60 * 60 * 1000 ms)
    // Standard session: 24 hours
    const durationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const sessionData = {
      user: matchedUser,
      expiresAt: Date.now() + durationMs,
      rememberMe: Boolean(rememberMe),
      loginTime: new Date().toISOString()
    };

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      } catch (err) {
        console.warn('Could not write session to localStorage due to quota', err);
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      } catch (err) {}
    }

    setCurrentUser(matchedUser);
    return { success: true, user: matchedUser };
  };

  /**
   * Password Management: Updates credentials securely in persistent storage
   */
  const changePassword = async (currentPassword, newPassword) => {
    if (!currentUser) throw new Error('Not authenticated');

    const cleanCurr = (currentPassword || '').trim();
    const cleanNew = (newPassword || '').trim();

    if (!cleanCurr) throw new Error('Current password is required.');
    if (!cleanNew) throw new Error('New password is required.');
    if (cleanNew.length < 6) throw new Error('New password must be at least 6 characters.');

    const users = getRegisteredUsers();
    const userIndex = users.findIndex((u) => u.id === currentUser.id);
    if (userIndex === -1) throw new Error('Account record not found.');

    const currHashed = await hashPassword(cleanCurr);
    const existing = users[userIndex];
    const isCurrentValid = existing.passwordHash === currHashed || existing.password === cleanCurr;

    if (!isCurrentValid) {
      throw new Error('Current password is incorrect.');
    }

    const newHashed = await hashPassword(cleanNew);
    users[userIndex] = {
      ...existing,
      passwordHash: newHashed,
      password: cleanNew // In-sync
    };

    saveRegisteredUsers(users);
    setCurrentUser(users[userIndex]);

    // Update active session with new user record
    if (typeof localStorage !== 'undefined') {
      const sessRaw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (sessRaw) {
        try {
          const s = JSON.parse(sessRaw);
          s.user = users[userIndex];
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s));
        } catch (e) {}
      }
    }

    return { success: true };
  };

  /**
   * Session Termination
   */
  const logout = () => {
    setCurrentUser(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('jjv_auth_session');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isWorker = currentUser?.role === 'worker';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isWorker,
        isAuthenticated: Boolean(currentUser),
        login,
        changePassword,
        logout,
        authError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
