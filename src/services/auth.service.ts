export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onAccessTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

export const authService = {
  // Sign in user
  signIn: async (credentials: AuthCredentials): Promise<AuthResponse> => {
    const response = await fetch("/auth/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Invalid credentials");
    }
    const data = await response.json();
    // Store tokens in localStorage
    localStorage.setItem("auth_token", data.accessToken);
    localStorage.setItem("refresh_token", data.refreshToken);
    return data;
  },

  // Sign up user
  signUp: async (credentials: AuthCredentials): Promise<AuthResponse> => {
    const response = await fetch("/auth/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to sign up");
    }
    const data = await response.json();
    // Store tokens in localStorage
    localStorage.setItem("auth_token", data.accessToken);
    localStorage.setItem("refresh_token", data.refreshToken);
    return data;
  },

  // Refresh access token
  refreshAccessToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    if (isRefreshing) {
      // Wait for the ongoing refresh to complete
      return new Promise((resolve) => {
        addRefreshSubscriber((token: string) => {
          resolve(token);
        });
      });
    }

    isRefreshing = true;

    try {
      const response = await fetch("/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      localStorage.setItem("auth_token", data.accessToken);

      isRefreshing = false;
      onAccessTokenRefreshed(data.accessToken);

      return data.accessToken;
    } catch (error) {
      isRefreshing = false;
      // Clear tokens and throw error
      authService.logout();
      throw error;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
  },

  // Get stored access token
  getToken: (): string | null => {
    return localStorage.getItem("auth_token");
  },

  // Get stored refresh token
  getRefreshToken: (): string | null => {
    return localStorage.getItem("refresh_token");
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("auth_token");
  },
};
