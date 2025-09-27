/**
 * Authentication utilities and API calls
 */

const API_BASE = 'http://localhost:8000';

export interface User {
  id: string;
  workos_user_id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

class AuthManager {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  async login(email: string, name: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data: LoginResponse = await response.json();
    this.token = data.token;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
    }

    return data;
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        // Token might be invalid
        this.token = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getAuthHeaders(): HeadersInit {
    if (this.token) {
      return {
        'Authorization': `Bearer ${this.token}`,
      };
    }
    return {};
  }
}

export const authManager = new AuthManager();