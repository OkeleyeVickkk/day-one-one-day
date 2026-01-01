import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/auth-context";
import { _router } from "../routes/_router";
import { LoadingSpinner } from "./loading-spinner";

interface ProtectedRouteProps {
	children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { user, loading } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!loading && !user) {
			navigate(_router.auth.login);
		}
	}, [user, loading, navigate]);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<LoadingSpinner />
			</div>
		);
	}

	if (!user) {
		return null; // Will redirect via useEffect
	}

	return <>{children}</>;
}
