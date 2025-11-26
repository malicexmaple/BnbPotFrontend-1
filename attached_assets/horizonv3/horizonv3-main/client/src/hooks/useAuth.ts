// Reference: javascript_log_in_with_replit blueprint
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading: queryLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Add minimum loading time of 2 seconds to show loading animation
  const [isLoading, setIsLoading] = useState(true);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!queryLoading && minLoadingComplete) {
      setIsLoading(false);
    }
  }, [queryLoading, minLoadingComplete]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
