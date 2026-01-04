import { authService } from "@/services/auth.service";

export async function fetchWithRefresh(
  url: string,
  options?: RequestInit
): Promise<Response> {
  let response = await fetch(url, options);

  // If we get a 401, try to refresh the token and retry
  if (response.status === 401) {
    try {
      // Refresh the access token
      const newAccessToken = await authService.refreshAccessToken();

      // Update the Authorization header with the new token
      const newOptions = {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${newAccessToken}`,
        },
      };

      // Retry the request with the new token
      response = await fetch(url, newOptions);
    } catch (error) {
      // If refresh fails, redirect to login
      // The authService.refreshAccessToken already clears tokens on failure
      window.location.href = "/auth";
      throw error;
    }
  }

  return response;
}
