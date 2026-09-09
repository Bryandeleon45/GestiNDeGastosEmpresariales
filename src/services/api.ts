export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    empresa?: string;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5263';

export class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaults: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      ...options,
    };

    const response = await fetch(url, defaults);
    const data = await response.json();

    if (!response.ok) {
      return {
        data: null as unknown as T,
        success: false,
        message: data.message || `Error ${response.status}`,
      };
    }

    // Return data - handle both {data: ...} wrapped and bare responses
    return {
      data: (data && typeof data === 'object' && 'data' in data) ? data.data : data,
      success: true,
      message: data.message,
    };
  }

  private getAuthHeaders(): HeadersInit {
    try {
      if (typeof window !== 'undefined' && localStorage) {
        const token = localStorage.getItem('jwt_token');
        if (token) {
          return { Authorization: `Bearer ${token}` };
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return {};
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, options);
  }

  async post<T>(endpoint: string, body: object, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  }

  async put<T>(endpoint: string, body: object, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  setAuthToken(token: string | null): void {
    try {
      if typeof window !== 'undefined' && localStorage) {
        if (token) {
          localStorage.setItem('jwt_token', token);
        } else {
          localStorage.removeItem('jwt_token');
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  async logout(): Promise<ApiResponse> {
    this.setAuthToken(null);
    return this.request('/api/auth/logout', { method: 'POST' });
  }
}

export const api = new ApiClient();