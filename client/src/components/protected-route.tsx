import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface AuthStatus {
  authenticated: boolean;
  isOwner: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  
  const { data: authStatus, isLoading } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/me"],
  });

  useEffect(() => {
    if (!isLoading && authStatus) {
      if (!authStatus.authenticated) {
        // Not authenticated - redirect to home
        setLocation("/");
      } else if (!authStatus.isOwner) {
        // Authenticated but not owner - redirect to home
        setLocation("/");
      }
    }
  }, [authStatus, isLoading, setLocation]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400" data-testid="text-loading">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authorized
  if (!authStatus?.authenticated || !authStatus?.isOwner) {
    return null;
  }

  // Render protected content if authorized
  return <>{children}</>;
}
