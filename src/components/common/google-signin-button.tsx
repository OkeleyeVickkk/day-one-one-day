import { useEffect, useRef } from "react";

declare global {
	interface Window {
		google: any;
	}
}

interface GoogleSignInButtonProps {
	onSuccess: (response: any) => void;
	onError?: () => void;
	text?: "signin_with" | "signup_with" | "continue_with" | "signin";
}

export default function GoogleSignInButton({ onSuccess, text = "signin_with" }: GoogleSignInButtonProps) {
	const buttonRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (window.google && buttonRef.current) {
			window.google.accounts.id.initialize({
				client_id: "YOUR_GOOGLE_CLIENT_ID", // Replace with your actual client ID
				callback: onSuccess,
			});

			window.google.accounts.id.renderButton(buttonRef.current, {
				theme: "outline",
				size: "large",
				text: text,
				width: "100%",
			});
		}
	}, [onSuccess, text]);

	return <div ref={buttonRef} className="w-full" />;
}
