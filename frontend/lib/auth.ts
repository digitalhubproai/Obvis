import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth(redirectTo = "/login") {
  const [router] = [useRouter()];

  useEffect(() => {
    const user = localStorage.getItem("token");
    if (!user) {
      router.push(redirectTo);
    }
  }, [router, redirectTo]);
}

export function signOut() {
  localStorage.removeItem("token");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Decode JWT payload to extract user info including is_admin.
 * Warning: client-side decode is for display only, not for auth decisions.
 */
export function getUserFromToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.sub,
      email: payload.email,
      is_admin: payload.is_admin ?? false,
    } as { id: string; email: string; is_admin: boolean };
  } catch {
    return null;
  }
}
