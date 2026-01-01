import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/auth-context";
import { _router } from "../../routes/_router";
import UploadSection from "../../components/upload-section";
import VideoGrid from "../../components/video-grid";
import { ActionButton } from "../../components/base/action-button";

export default function DashboardIndex() {
	const { user } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!user) {
			navigate(_router.landing.index);
		}
	}, [user, navigate]);

	const handleUploadComplete = () => {
		// Refresh the video grid by forcing a re-render
		window.location.reload();
	};

	const displayName = user?.full_name || user?.email?.split("@")[0] || "User";

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Welcome, {displayName}!</h1>
					<p className="mt-2 text-gray-600">Record and relive your daily moments</p>
				</div>
				<div className="flex space-x-4">
					<ActionButton href={_router.settings} variant="outline">
						Settings
					</ActionButton>
				</div>
			</div>

			<UploadSection onUploadComplete={handleUploadComplete} />

			<div>
				<h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Videos</h2>
				<VideoGrid />
			</div>
		</div>
	);
}
