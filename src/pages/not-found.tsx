import { ActionButton } from "../components/base/action-button";
import { _router } from "../routes/_router";

export default function NotFoundPage() {
	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
					<div className="text-6xl mb-4">😵</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">404 - Page Not Found</h1>
					<p className="text-gray-600 mb-6">Sorry, the page you're looking for doesn't exist or has been moved.</p>
					<div className="flex items-center gap-4 justify-center">
						<ActionButton href={_router.landing.index}>Go to Homepage</ActionButton>
						<ActionButton href={_router.dashboard.index} variant="outline">
							Go to Dashboard
						</ActionButton>
					</div>
					<div className="mt-6 text-sm text-gray-500">
						<p>If you believe this is an error, please contact support.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
