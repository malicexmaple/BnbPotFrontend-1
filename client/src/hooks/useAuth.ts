import { useQuery } from "@tanstack/react-query";

interface SessionData {
  authenticated: boolean;
  walletAddress?: string;
  username?: string;
  agreedToTerms?: boolean;
  isAdmin?: boolean;
}

interface AuthState {
  user: {
    walletAddress?: string;
    username?: string;
    role?: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

export function useAuth(): AuthState {
  const { data: session, isLoading } = useQuery<SessionData>({
    queryKey: ["/api/auth/session"],
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const isAuthenticated = session?.authenticated ?? false;
  const isAdmin = session?.isAdmin ?? false;

  return {
    user: isAuthenticated ? {
      walletAddress: session?.walletAddress,
      username: session?.username,
      role: isAdmin ? 'admin' : 'user',
    } : null,
    isAuthenticated,
    isLoading,
    isAdmin,
  };
}
