import { useState } from "react";
import type { ChangeEvent } from "react";
import { supabase } from "../../lib/supabaseClient";
import { _router } from "../../routes/_router";
import { ActionButton } from "../../components/base/action-button";
import CustomInput from "../../components/base/custom-input";

export default function PasswordResetPage() {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			setIsLoading(false);
			return;
		}

		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			setIsLoading(false);
			return;
		}

		try {
			const { error: updateError } = await supabase.auth.updateUser({
				password: password,
			});

			if (updateError) throw updateError;

			setIsSubmitted(true);
		} catch (err: any) {
			setError(err.message || "Failed to update password. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	if (isSubmitted) {
		return (
			<div>
				<div className="text-center">
					<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
						<svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Password reset successful</h2>
					<p className="mt-2 text-center text-sm text-gray-600">Your password has been updated. You can now sign in with your new password.</p>
					<div className="mt-6">
						<ActionButton href={_router.auth.login} className="w-full">
							Sign in
						</ActionButton>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="text-center">
				<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset your password</h2>
				<p className="mt-2 text-center text-sm text-gray-600">Enter your new password below.</p>
			</div>
			<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
				<CustomInput
					label="New Password"
					id="password"
					name="password"
					type="password"
					required
					placeholder="New password"
					value={password}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
				/>
				<CustomInput
					label="Confirm New Password"
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					required
					placeholder="Confirm new password"
					value={confirmPassword}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
				/>
				{error && <div className="text-red-600 text-sm text-center">{error}</div>}
				<div>
					<ActionButton type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Updating password..." : "Reset password"}
					</ActionButton>
				</div>
			</form>
		</div>
	);
}
