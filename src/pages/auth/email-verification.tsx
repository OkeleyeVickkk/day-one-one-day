import { useState } from "react";
import type { ChangeEvent } from "react";
import { supabase } from "../../lib/supabaseClient";
import { _router } from "../../routes/_router";
import CustomInput from "../../components/base/custom-input";
import { ActionButton } from "../../components/base/action-button";
import { Spinner } from "../../components/ui/spinner";

export default function EmailVerificationPage() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isResent, setIsResent] = useState(false);
	const [resendTimer, setResendTimer] = useState(0);

	const handleResend = async () => {
		if (!email.trim()) {
			alert("Please enter your email address");
			return;
		}

		setIsLoading(true);
		try {
			const { error } = await supabase.auth.resend({
				type: "signup",
				email: email.trim(),
			});

			if (error) throw error;

			setIsResent(true);
			setResendTimer(60);

			// Countdown timer
			const interval = setInterval(() => {
				setResendTimer((prev) => {
					if (prev <= 1) {
						clearInterval(interval);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} catch (error: any) {
			alert(`Failed to resend verification email: ${error.message}`);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 mb-4">
					<svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<h1 className="text-3xl font-bold text-gray-900">Check your email</h1>
				<p className="mt-2 text-sm text-gray-600">We've sent a verification link to your email address. Click the link to verify your account.</p>
			</div>

			<form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
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
					disabled={isLoading || isResent}
				/>

				<ActionButton type="button" onClick={handleResend} disabled={isLoading || resendTimer > 0} className="w-full">
					{isLoading ? (
						<>
							<Spinner />
							<span>Sending...</span>
						</>
					) : resendTimer > 0 ? (
						`Resend in ${resendTimer}s`
					) : isResent ? (
						"Email sent! Check your inbox"
					) : (
						"Resend verification email"
					)}
				</ActionButton>
			</form>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-gray-200" />
				</div>
				<div className="relative flex justify-center text-sm">
					<span className="bg-white px-2 text-gray-500">or</span>
				</div>
			</div>

			<ActionButton href={_router.auth.login} variant="outline" className="w-full">
				Back to sign in
			</ActionButton>
		</div>
	);
}
