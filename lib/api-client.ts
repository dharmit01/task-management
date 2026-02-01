/**
 * API client utility with authentication
 */

interface FetchOptions extends RequestInit {
  data?: any;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    // Use relative URLs in browser, full URL on server
    if (typeof window !== 'undefined') {
      // In browser, use empty string for relative URLs
      this.baseUrl = '';
    } else {
      // On server, use the configured URL or localhost
      this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private getHeaders(customHeaders?: HeadersInit): HeadersInit {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { data, ...fetchOptions } = options;

    const config: RequestInit = {
      ...fetchOptions,
      headers: this.getHeaders(fetchOptions.headers),
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'API request failed');
    }

    return responseData;
  }

  get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', data });
  }

  patch<T>(endpoint: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', data });
  }

  delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
