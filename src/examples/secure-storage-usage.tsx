// Usage Example: Secure Storage in Login
// Update your login flow to use secure storage

'use client';

import { useState } from 'react';
import { secureStorage } from '@/lib/secure-storage';
import { useRouter } from 'next/navigation';

export function LoginWithSecureStorage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();

        try {
            // Your existing login API call
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                // ✅ Store tokens securely (Android Keystore)
                await secureStorage.saveUserCredentials({
                    userId: data.user.id,
                    email: data.user.email,
                    authToken: data.accessToken,
                    refreshToken: data.refreshToken,
                });

                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Login failed:', error);
        }
    }

    return (
        <form onSubmit={handleLogin}>
            {/* Your login form */}
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Login</button>
        </form>
    );
}

// Auto-login on app launch
export async function checkStoredCredentials() {
    const hasCredentials = await secureStorage.hasStoredCredentials();

    if (hasCredentials) {
        const credentials = await secureStorage.getUserCredentials();

        if (credentials) {
            // Verify token is still valid
            const response = await fetch('/api/auth/verify', {
                headers: {
                    Authorization: `Bearer ${credentials.authToken}`,
                },
            });

            if (response.ok) {
                return credentials; // Auto-login successful
            } else {
                // Token expired, clear storage
                await secureStorage.clearAll();
            }
        }
    }

    return null; // No valid credentials
}

// Logout
export async function handleLogout() {
    // Clear secure storage
    await secureStorage.clearAll();

    // Clear any other app data
    localStorage.clear();

    // Redirect to login
    window.location.href = '/login';
}
