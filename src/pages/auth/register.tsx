import { useState } from "react";
import type { ChangeEvent } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router";
import { _router } from "../../routes/_router";
import GoogleSignInButton from "../../components/common/google-signin-button";
import CustomInput from "../../components/base/custom-input";
import { ActionButton } from "../../components/base/action-button";
import { Spinner } from "../../components/ui/spinner";

const PASSWORD_MIN_LENGTH = 8;

export default function RegisterPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const navigate = useNavigate();

	const validateForm = (): string | null => {
		if (!name.trim()) {
			return "Name is required";
		}
		if (!email.trim()) {
			return "Email is required";
		}
		if (!password) {
			return "Password is required";
		}
		if (password.length < PASSWORD_MIN_LENGTH) {
			return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
		}
		if (password !== confirmPassword) {
			return "Passwords do not match";
		}
		return null;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccessMessage(null);

		const validationError = validateForm();
		if (validationError) {
			setError(validationError);
			return;
		}

		setLoading(true);
		try {
			const { data, error } = await supabase.auth.signUp({
				email: email.trim(),
				password,
			});

			if (error) throw error;
			if (!data.user) throw new Error("User creation failed");

			// Save full_name to profiles table
			const { error: profileError } = await supabase.from("profiles").upsert(
				{
					id: data.user.id,
					full_name: name.trim(),
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "id" }
			);

			if (profileError) throw profileError;

			setSuccessMessage("Account created! Check your email to verify your account.");
			setName("");
			setEmail("");
			setPassword("");
			setConfirmPassword("");

			// Redirect to login after 2 seconds
			setTimeout(() => {
				navigate(_router.auth.login);
			}, 2000);
		} catch (err: any) {
			setError(err.message || "Failed to create account. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleRegister = async (response: any) => {
		setError(null);
		setLoading(true);

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
			setError(err.message || "Google sign up failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="text-3xl font-bold text-gray-900">Create account</h1>
				<p className="mt-2 text-sm text-gray-600">Start your daily video journey</p>
			</div>

			{error && (
				<div className="rounded-md bg-red-50 p-4 border border-red-200">
					<p className="text-sm font-medium text-red-800">{error}</p>
				</div>
			)}

			{successMessage && (
				<div className="rounded-md bg-green-50 p-4 border border-green-200">
					<p className="text-sm font-medium text-green-800">{successMessage}</p>
				</div>
			)}

			<form className="space-y-5" onSubmit={handleSubmit}>
				<CustomInput
					label="Full name"
					id="name"
					name="name"
					type="text"
					autoComplete="name"
					placeholder="John Doe"
					required
					value={name}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
					disabled={loading}
				/>
				<CustomInput
					label="Email address"
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					placeholder="you@example.com"
					required
					value={email}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
					disabled={loading}
				/>
				<CustomInput
					label="Password"
					id="password"
					name="password"
					type={showPassword ? "text" : "password"}
					autoComplete="new-password"
					placeholder="••••••••"
					description={`At least ${PASSWORD_MIN_LENGTH} characters`}
					required
					value={password}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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

				<CustomInput
					label="Confirm password"
					id="confirmPassword"
					name="confirmPassword"
					type={showConfirm ? "text" : "password"}
					autoComplete="new-password"
					placeholder="••••••••"
					required
					value={confirmPassword}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
					disabled={loading}
					right={
						<button
							type="button"
							onClick={() => setShowConfirm((s) => !s)}
							className="text-xs font-medium text-gray-500 hover:text-gray-700"
							aria-label={showConfirm ? "Hide password" : "Show password"}>
							{showConfirm ? "Hide" : "Show"}
						</button>
					}
				/>

				<ActionButton type="submit" className="w-full" disabled={loading}>
					{loading ? (
						<>
							<Spinner />
							<span>Creating account...</span>
						</>
					) : (
						"Create account"
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

			<GoogleSignInButton onSuccess={handleGoogleRegister} text="signup_with" />

			<p className="text-center text-sm text-gray-600">
				Already have an account?{" "}
				<ActionButton href={_router.auth.login} variant="link" className="p-0 h-auto font-semibold">
					Sign in
				</ActionButton>
			</p>
		</div>
	);
}
