import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/auth-context";
import { _router } from "../../routes/_router";

export default function Index() {
	const { user, loading } = useAuth();
	const navigate = useNavigate();
	const [isInitializing, setIsInitializing] = useState(true);

	useEffect(() => {
		// Once auth loading is done, redirect if user exists
		if (!loading) {
			setIsInitializing(false);
			if (user) {
				navigate(_router.dashboard.index);
			}
		}
	}, [user, loading, navigate]);

	if (isInitializing || loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (user) {
		return null; // Will redirect
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
			<div className="max-w-4xl mx-auto text-center">
				<div className="mb-12">
					<h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
						Day One,
						<br />
						One Day
					</h1>
					<p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
						Your private daily video journal. Record one video per day and build a beautiful timeline of your life. Share your journey when you're
						ready.
					</p>
					<div className="text-lg text-gray-500 mb-8">
						✨ Record or upload videos up to 90 seconds
						<br />
						🔒 Private by default, shareable when you choose
						<br />
						📱 Beautiful timeline view for your memories
					</div>
				</div>

				<div className="space-x-4">
					<a
						href={_router.auth.login}
						className="inline-block px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
						Sign In
					</a>
					<a
						href={_router.auth.register}
						className="inline-block px-8 py-3 bg-white text-blue-600 font-medium rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors">
						Create Account
					</a>
				</div>
			</div>
		</div>
	);
}
