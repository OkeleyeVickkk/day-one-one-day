import { useAuth } from "../../contexts/auth-context";
import VideoGrid from "../../components/video-grid";
import { Clock2, Film } from "lucide-react";

export default function History() {
	const { user } = useAuth();

	return (
		<div className="min-h-screen">
			<div className="bg-linear-to-br from-blue-50 to-indigo-100 rounded-xl p-8 mb-6">
				<div className="max-w-4xl mx-auto text-center">
					<div className="mb-6 inline-flex items-center justify-center space-x-3">
						<Clock2 className="w-6 h-6 text-blue-600" />
						<h1 className="text-4xl md:text-5xl font-bold text-gray-900">Video History</h1>
					</div>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">
						Your personal timeline of uploaded videos — private by default, shareable when you choose.
					</p>
				</div>
			</div>

			<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div className="p-6 border-b border-gray-200">
					<h2 className="text-xl font-semibold flex items-center">
						<Film className="w-5 h-5 mr-2" /> All Videos
					</h2>
					<p className="text-gray-600 mt-1">Browse, share, and manage your uploaded videos</p>
				</div>

				<div className="p-6">
					<VideoGrid userId={user?.id} showFilters={true} />
				</div>
			</div>
		</div>
	);
}
