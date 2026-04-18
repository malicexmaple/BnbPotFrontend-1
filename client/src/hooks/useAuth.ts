import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface SessionData {
  authenticated: boolean;
  walletAddress?: string;
  username?: string;
  agreedToTerms?: boolean;
  isAdmin?: boolean;
}

type EnrichedUser = (Omit<Partial<User>, "walletAddress" | "username"> & {
  walletAddress?: string;
  username?: string;
  role?: string;
}) | null;

interface AuthState {
  user: EnrichedUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

export function useAuth(): AuthState {
  const { data: session, isLoading: sessionLoading } = useQuery<SessionData>({
    queryKey: ["/api/auth/session"],
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const isAuthenticated = session?.authenticated ?? false;
  const isAdmin = session?.isAdmin ?? false;

  const { data: fullUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 30000,
  });

  const user: EnrichedUser = isAuthenticated
    ? {
        ...(fullUser ?? {}),
        walletAddress: session?.walletAddress ?? fullUser?.walletAddress ?? undefined,
        username: session?.username ?? fullUser?.username ?? undefined,
        role: isAdmin ? "admin" : (fullUser as any)?.role ?? "user",
      }
    : null;

  return {
    user,
    isAuthenticated,
    isLoading: sessionLoading || (isAuthenticated && userLoading),
    isAdmin,
  };
}
