import { useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { Spinner } from "../../components/ui/spinner";

export default function OAuthCallback() {
	const navigate = useNavigate();

	useEffect(() => {
		const handleCallback = async () => {
			try {
				// Supabase handles the OAuth callback automatically with detectSessionInUrl: true
				const {
					data: { session },
				} = await supabase.auth.getSession();

				if (session) {
					// Successfully authenticated
					navigate("/dashboard");
				} else {
					// Auth failed, redirect to login
					navigate("/auth/login");
				}
			} catch (error) {
				console.error("OAuth callback error:", error);
				navigate("/auth/login");
			}
		};

		handleCallback();
	}, [navigate]);

	return (
		<div className="min-h-screen flex items-center justify-center">
			<Spinner />
		</div>
	);
}
