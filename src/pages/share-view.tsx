import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { supabase } from "../lib/supabaseClient";
import { LoadingSpinner } from "../components/loading-spinner";

interface Video {
	id: string;
	date: string;
	video_path: string;
	duration: number;
	compressed_size: number;
	created_at: string;
}

export default function ShareView() {
	const { token } = useParams<{ token: string }>();
	const [videos, setVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

	useEffect(() => {
		if (token) {
			fetchSharedVideos(token);
		}
	}, [token]);

	const fetchSharedVideos = async (shareToken: string) => {
		try {
			// First, find the profile with this share token
			const { data: profile, error: profileError } = await supabase
				.from("profiles")
				.select("user_id, share_enabled")
				.eq("share_token", shareToken)
				.eq("share_enabled", true)
				.single();

			if (profileError || !profile) {
				setError("This journey is private or the link has expired.");
				return;
			}

			// Fetch all videos for this user
			const { data: videosData, error: videosError } = await supabase
				.from("daily_videos")
				.select("*")
				.eq("user_id", profile.user_id)
				.order("date", { ascending: true });

			if (videosError) throw videosError;

			setVideos(videosData || []);

			// Generate signed URLs for all videos
			if (videosData) {
				const urls: Record<string, string> = {};
				for (const video of videosData) {
					const { data: signedUrlData } = await supabase.storage.from("daily-videos").createSignedUrl(video.video_path, 86400); // 24 hours

					if (signedUrlData?.signedUrl) {
						urls[video.id] = signedUrlData.signedUrl;
					}
				}
				setSignedUrls(urls);
			}
		} catch (error) {
			console.error("Error fetching shared videos:", error);
			setError("Failed to load the shared journey.");
		} finally {
			setLoading(false);
		}
	};

	const getVideoUrl = (videoId: string) => {
		return signedUrls[videoId] || "";
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<LoadingSpinner />
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">Journey Not Found</h1>
					<p className="text-gray-600">{error}</p>
				</div>
			</div>
		);
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const getJourneyTitle = () => {
		if (videos.length === 0) return "A Journey";

		const startDate = new Date(videos[0].date);
		const endDate = new Date(videos[videos.length - 1].date);
		const startYear = startDate.getFullYear();
		const endYear = endDate.getFullYear();

		if (startYear === endYear) {
			return `${startYear} Journey`;
		} else {
			return `${startYear} - ${endYear} Journey`;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 py-8">
				<header className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">{getJourneyTitle()}</h1>
					<p className="text-xl text-gray-600">{videos.length} days of memories</p>
				</header>

				{videos.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-gray-500">No videos in this journey yet.</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{videos.map((video) => (
							<div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
								<div className="p-4">
									<h3 className="font-semibold text-gray-900 mb-2">{formatDate(video.date)}</h3>
									<div className="aspect-video bg-gray-100 rounded">
										<video className="w-full h-full object-cover" controls preload="metadata" src={getVideoUrl(video.id)}>
											Your browser does not support the video tag.
										</video>
									</div>
									<div className="mt-2 text-sm text-gray-500">
										Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
