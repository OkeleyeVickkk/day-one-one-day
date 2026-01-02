import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

interface VideoPlayerProps {
	videoId: string;
	isOwner?: boolean;
	autoPlay?: boolean;
	controls?: boolean;
}

export default function VideoPlayer({ videoId, isOwner = false, autoPlay = false, controls = true }: VideoPlayerProps) {
	const [videoUrl, setVideoUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		fetchVideoUrl();
	}, [videoId]);

	async function fetchVideoUrl() {
		try {
			setLoading(true);
			setError(null);

			// 1. Get video metadata from Supabase
			const { data: video, error: videoError } = await supabase
				.from("videos")
				.select("drive_file_id, is_public, storage_url")
				.eq("id", videoId)
				.single();

			if (videoError) throw videoError;

			// 2. Try different sources in order
			let url = null;

			// Option A: If we have a storage_url (from Supabase Storage)
			if (video.storage_url) {
				url = video.storage_url;
			}
			// Option B: If owner and has drive_file_id, use Google Drive embed
			else if (isOwner && video.drive_file_id) {
				// Google Drive embed URL
				url = `https://drive.google.com/file/d/${video.drive_file_id}/preview`;
			}
			// Option C: Public Google Drive link
			else if (video.is_public && video.drive_file_id) {
				url = `https://drive.google.com/file/d/${video.drive_file_id}/preview`;
			}
			// Option D: If video was stored locally in Supabase Storage
			else {
				// Try to get from videos bucket
				const { data: storageData } = await supabase.storage.from("processed-videos").createSignedUrl(`${videoId}/video.mp4`, 3600); // 1 hour expiry

				url = storageData?.signedUrl || null;
			}

			if (!url) {
				throw new Error("No video source available");
			}

			setVideoUrl(url);
		} catch (err: any) {
			console.error("Failed to load video:", err);
			setError(err.message || "Failed to load video");
		} finally {
			setLoading(false);
		}
	}

	if (loading) {
		return (
			<div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
				<div className="text-center text-white">
					<p className="text-red-400">⚠️ Video unavailable</p>
					<p className="text-sm text-gray-400 mt-2">{error}</p>
					{isOwner && <p className="text-xs text-gray-500 mt-4">Note: Google Drive videos need to be made public or use embed links</p>}
				</div>
			</div>
		);
	}

	if (!videoUrl) {
		return (
			<div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
				<p className="text-gray-400">Video source not found</p>
			</div>
		);
	}

	return (
		<div className="relative w-full">
			{/* Google Drive embed uses iframe, local videos use video tag */}
			{videoUrl.includes("drive.google.com") ? (
				<div className="aspect-video bg-black rounded-lg overflow-hidden">
					<iframe src={videoUrl} className="w-full h-full border-0" allow="autoplay; encrypted-media" allowFullScreen title="Video player" />
				</div>
			) : (
				<video
					ref={videoRef}
					src={videoUrl}
					className="w-full aspect-video bg-black rounded-lg"
					controls={controls}
					autoPlay={autoPlay}
					playsInline
				/>
			)}

			{/* Quality indicator */}
			<div className="absolute top-4 right-4 bg-gray-200/20 backdrop-blur-lg border border-white/10 text-white text-xs px-2 py-1.5 rounded">
				{videoUrl.includes("drive.google.com") ? "Google Drive" : "Direct"}
			</div>
		</div>
	);
}
