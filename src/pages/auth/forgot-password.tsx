import { useState } from "react";
import type { ChangeEvent } from "react";
import { supabase } from "../../lib/supabaseClient";
import { _router } from "../../routes/_router";
import { ActionButton } from "../../components/base/action-button";
import CustomInput from "../../components/base/custom-input";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email.trim()) {
			return;
		}

		setIsLoading(true);

		try {
			const { error: apiError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
				redirectTo: window.location.origin + _router.auth.passwordReset,
			});

			if (apiError) throw apiError;

			setIsSubmitted(true);
			setEmail("");
		} catch (err: any) {
			// Handle error silently or show in toast
			console.error("Password reset error:", err.message);
		} finally {
			setIsLoading(false);
		}
	};

	if (isSubmitted) {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
						<svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h1 className="text-3xl font-bold text-gray-900">Check your email</h1>
					<p className="mt-2 text-sm text-gray-600">
						We've sent a password reset link. Click the link in the email to reset your password. The link will expire in 24 hours.
					</p>
				</div>

				<div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
					<div className="flex items-start gap-3">
						<div className="shrink-0">
							<span className="text-2xl">📧</span>
						</div>
						<div>
							<p className="text-sm font-medium text-blue-900">Password Reset Email</p>
							<p className="text-sm text-blue-700 mt-1">
								Check your inbox and spam folder for an email from us with instructions to reset your password.
							</p>
						</div>
					</div>
				</div>

				<div className="space-y-3">
					<ActionButton href={_router.auth.login} className="w-full">
						Back to sign in
					</ActionButton>
					<button
						type="button"
						onClick={() => setIsSubmitted(false)}
						className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors py-2">
						Didn't receive the email? Try again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-md">
			{/* Main Card */}
			<div>
				{/* Header */}
				<div className="text-center mb-8">
					<div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
						<svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
							/>
						</svg>
					</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot your password?</h1>
					<p className="text-gray-600 leading-relaxed">No worries! Enter your email address and we'll send you a link to reset your password.</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					<CustomInput
						label="Email address"
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						required
						placeholder="Enter your email address"
						value={email}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
					/>

					<ActionButton type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? (
							<div className="flex items-center justify-center space-x-2">
								<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								<span>Sending reset link...</span>
							</div>
						) : (
							"Send reset link"
						)}
					</ActionButton>
				</form>

				{/* Divider */}
				<div className="relative my-8">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-200" />
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="px-4 bg-white text-gray-500">or</span>
					</div>
				</div>

				{/* Back to sign in */}
				<div className="text-center">
					<ActionButton href={_router.auth.login} variant="outline" className="w-full">
						Back to sign in
					</ActionButton>
				</div>
			</div>

			{/* Footer */}
			<div className="text-center mt-8">
				<p className="text-sm text-gray-500">
					Don't have an account?{" "}
					<ActionButton href={_router.auth.register} variant="link" className="p-0 h-auto font-medium">
						Create one
					</ActionButton>
				</p>
			</div>
		</div>
	);
}
