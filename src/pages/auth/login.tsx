import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router";
import { _router } from "../../routes/_router";
import { useAuth } from "../../contexts/auth-context";
import GoogleSignInButton from "../../components/common/google-signin-button";
import { ActionButton } from "../../components/base/action-button";
import CustomInput from "../../components/base/custom-input";
import { LoadingSpinner } from "../../components/loading-spinner";

export default function LoginPage() {
	const { user, loading: authLoading } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	// Redirect if already authenticated
	useEffect(() => {
		if (!authLoading && user) {
			navigate(_router.dashboard.index);
		}
	}, [user, authLoading, navigate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		if (!email.trim() || !password.trim()) {
			setError("Please enter both email and password");
			setLoading(false);
			return;
		}

		try {
			const { error } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password,
			});

			if (error) throw error;

			// AuthContext will handle the state update and navigation
		} catch (err: any) {
			setError(err.message || "Failed to sign in. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleLogin = async (response: any) => {
		setLoading(true);
		setError(null);

		try {
			if (!response?.credential) {
				throw new Error("Google authentication failed");
			}

			const { error } = await supabase.auth.signInWithIdToken({
				provider: "google",
				token: response.credential,
			});

			if (error) throw error;

			// AuthContext will handle the state update and navigation
		} catch (err: any) {
			setError(err.message || "Google sign in failed");
		} finally {
			setLoading(false);
		}
	};

	if (authLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<LoadingSpinner />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="text-3xl font-bold text-gray-900">Sign in</h1>
				<p className="mt-2 text-sm text-gray-600">Welcome back to your video journal</p>
			</div>

			{error && (
				<div className="rounded-md bg-red-50 p-4 border border-red-200">
					<p className="text-sm font-medium text-red-800">{error}</p>
				</div>
			)}

			<form className="space-y-5" onSubmit={handleSubmit}>
				<CustomInput
					label="Email address"
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					placeholder="you@example.com"
					value={email}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
					required
					disabled={loading}
				/>

				<CustomInput
					label="Password"
					id="password"
					name="password"
					type={showPassword ? "text" : "password"}
					autoComplete="current-password"
					placeholder="••••••••"
					value={password}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
					required
					disabled={loading}
					right={
						<button
							type="button"
							onClick={() => setShowPassword((s) => !s)}
							className="text-xs font-medium text-gray-500 hover:text-gray-700"
							aria-label={showPassword ? "Hide password" : "Show password"}>
							{showPassword ? "Hide" : "Show"}
						</button>
					}
				/>

				<div className="flex items-center justify-end">
					<ActionButton href={_router.auth.forgotPassword} variant="link" className="text-sm p-0 h-auto">
						Forgot password?
					</ActionButton>
				</div>

				<ActionButton type="submit" className="w-full" disabled={loading}>
					{loading ? (
						<>
							<LoadingSpinner />
							<span>Signing in...</span>
						</>
					) : (
						"Sign in"
					)}
				</ActionButton>
			</form>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-gray-200" />
				</div>
				<div className="relative flex justify-center text-sm">
					<span className="bg-white px-2 text-gray-500">Or continue with</span>
				</div>
			</div>

			<GoogleSignInButton onSuccess={handleGoogleLogin} text="signin_with" />

			<p className="text-center text-sm text-gray-600">
				Don't have an account?{" "}
				<ActionButton href={_router.auth.register} variant="link" className="p-0 h-auto font-semibold">
					Sign up
				</ActionButton>
			</p>
		</div>
	);
}
