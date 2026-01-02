import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { cn } from "../lib/utils";
import VideoPlayer from "./video-player";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
	Play,
	Globe,
	Link2,
	Download,
	Trash2,
	Eye,
	Calendar,
	CheckCircle,
	Loader2,
	Lock,
	MoreVertical,
	HardDrive,
	Folder,
	MessageSquare,
	FolderPlus,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import MoveToFolderDialog from "./video/move-to-folder-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

interface VideoCardProps {
	video: {
		id: string;
		title: string;
		description?: string | null;
		caption?: string | null;
		original_size?: number | null;
		compressed_size: number | null;
		created_at: string;
		is_public: boolean;
		views_count: number;
		status: string;
		folder_id?: string | null;
		folder?: {
			id: string;
			name: string;
			color: string;
		} | null;
		tags?: string[];
	};
	isOwner?: boolean;
	onDelete?: (videoId: string) => void;
	onShare?: (videoId: string) => void;
	onTogglePrivacy?: (videoId: string, isPublic: boolean) => void;
	onFolderChange?: () => void;
	viewMode?: "grid" | "list";
}

export default function VideoCard({ video, isOwner = false, onDelete, onShare, onTogglePrivacy, onFolderChange, viewMode = "grid" }: VideoCardProps) {
	const [showDropdown, setShowDropdown] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Format file size
	const formatFileSize = (bytes: number | null) => {
		if (!bytes) return "0 B";
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
	};

	// Format date nicely
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		let relative = "";
		if (diffMins < 1) relative = "just now";
		else if (diffMins < 60) relative = `${diffMins}m ago`;
		else if (diffHours < 24) relative = `${diffHours}h ago`;
		else if (diffDays < 30) relative = `${diffDays}d ago`;
		else {
			relative = date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
			});
		}

		return {
			relative,
			full: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
			datetime: date.toISOString(),
		};
	};

	const handleDownload = async () => {
		if (!isOwner) return;

		try {
			// Get Google Drive file ID
			const { data: videoData } = await supabase.from("videos").select("drive_file_id").eq("id", video.id).single();

			if (!videoData?.drive_file_id) {
				alert("No file found in Google Drive");
				return;
			}

			// Create download link
			const driveUrl = `https://drive.google.com/uc?export=download&id=${videoData.drive_file_id}`;
			window.open(driveUrl, "_blank");
		} catch (error) {
			console.error("Download failed:", error);
			alert("Download failed. Please try again.");
		}
	};

	const handleShare = async () => {
		try {
			// Generate share URL using video ID
			const shareUrl = `${window.location.origin}/v/${video.id}`;

			// Copy to clipboard
			await navigator.clipboard.writeText(shareUrl);
			alert("Share link copied to clipboard!");

			if (onShare) {
				onShare(video.id);
			}
		} catch (error) {
			console.error("Share failed:", error);
			alert("Failed to copy share link");
		}
	};

	const handleDelete = async () => {
		if (!isOwner || !confirm("Are you sure you want to delete this video?")) return;

		setIsDeleting(true);
		try {
			const { error } = await supabase.from("videos").delete().eq("id", video.id);

			if (error) throw error;

			alert("Video removed from your library");

			if (onDelete) {
				onDelete(video.id);
			}
		} catch (error) {
			console.error("Delete failed:", error);
			alert("Failed to delete video");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleTogglePrivacy = async () => {
		if (!isOwner) return;

		try {
			const newPrivacy = !video.is_public;
			const { error } = await supabase.from("videos").update({ is_public: newPrivacy }).eq("id", video.id);

			if (error) throw error;

			alert(`Video is now ${newPrivacy ? "public" : "private"}`);

			if (onTogglePrivacy) {
				onTogglePrivacy(video.id, newPrivacy);
			}
		} catch (error) {
			console.error("Privacy update failed:", error);
			alert("Failed to update privacy");
		}
	};

	const dateInfo = formatDate(video.created_at);

	const canPlay = isOwner || video.is_public;

	// List view layout
	if (viewMode === "list") {
		return (
			<>
				<Card className="p-4">
					<div className="flex items-center gap-4">
						{/* Thumbnail */}
						<div
							className={cn("shrink-0 w-48 aspect-video bg-gray-900 rounded-lg overflow-hidden group/thumb", canPlay && "cursor-pointer")}
							onClick={() => canPlay && setIsPlaying(true)}>
							<div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-800 to-gray-900 group-hover/thumb:from-gray-700 group-hover/thumb:to-gray-800 transition-colors">
								<div className="text-center">
									<div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 group-hover/thumb:scale-110 transition-transform">
										<Play className="w-6 h-6 text-white ml-0.5" />
									</div>
									<p className="text-white/80 text-xs">Click to play</p>
								</div>
							</div>
						</div>

						{/* Content */}
						<div className="flex-1 h-full min-w-0">
							<div className="flex items-center justify-between gap-4 mb-2">
								<div className="min-w-0 flex-1">
									<h3 className="font-semibold text-gray-900 truncate" title={video.title}>
										{video.title}
									</h3>
									{video.description && <p className="text-sm text-gray-600 mt-1 line-clamp-1">{video.description}</p>}

									{/* Caption Display */}
									{video.caption && (
										<p className="text-sm text-gray-600 mt-1 line-clamp-1 flex items-center">
											<MessageSquare className="w-4 h-4 mr-2 shrink-0" />
											{video.caption}
										</p>
									)}

									{/* Folder Badge */}
									{video.folder && (
										<Badge
											variant="outline"
											className="text-xs mt-2 inline-flex items-center"
											style={{
												borderColor: video.folder.color,
												color: video.folder.color,
												backgroundColor: `${video.folder.color}10`,
											}}>
											<Folder className="w-3 h-3 mr-1" />
											{video.folder.name}
										</Badge>
									)}
								</div>
							</div>

							{/* Stats Row */}
							<div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3">
								<span className="flex items-center" title={`Uploaded ${dateInfo.relative}`}>
									<Calendar className="w-4 h-4 mr-1 shrink-0" /> {dateInfo.full}
								</span>

								<span className="flex items-center">
									<HardDrive className="w-4 h-4 mr-1 shrink-0" />
									{formatFileSize(video.compressed_size)}
								</span>

								<span className="flex items-center">
									<Eye className="w-4 h-4 mr-1 shrink-0" />
									{video.views_count.toLocaleString()} views
								</span>

								{/* Status Badge */}
								{video.status === "completed" ? (
									<Badge className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 shrink-0">
										<CheckCircle className="w-4 h-4 mr-1" /> Ready
									</Badge>
								) : video.status === "processing" ? (
									<Badge className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 shrink-0">
										<Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing
									</Badge>
								) : (
									<Badge className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 shrink-0">Pending</Badge>
								)}

								<Badge variant={video.is_public ? "default" : "secondary"} className="flex items-center">
									{video.is_public ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
									{video.is_public ? "Public" : "Private"}
								</Badge>

								{/* Compression Stats */}
								{video.original_size && video.compressed_size && (
									<span className="flex items-center text-green-600 font-medium ml-auto">
										↓{Math.round(((video.original_size - video.compressed_size) / video.original_size) * 100)}% smaller
									</span>
								)}
							</div>

							{/* Progress Bar for Processing */}
							{video.status === "processing" && (
								<div className="mt-3">
									<Progress value={75} className="w-full" />
									<p className="text-xs text-gray-500 mt-1">Compressing and uploading...</p>
								</div>
							)}
						</div>

						{/* Actions Dropdown */}
						{isOwner && (
							<DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="shrink-0">
										<MoreVertical className="w-4 h-4 text-gray-600" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={handleDownload}>
										<Download className="w-4 h-4 mr-2" /> Download from Drive
									</DropdownMenuItem>

									<DropdownMenuItem onClick={handleShare}>
										<Link2 className="w-4 h-4 mr-2" /> Copy Share Link
									</DropdownMenuItem>

									<MoveToFolderDialog videoId={video.id} videoTitle={video.title} currentFolderId={video.folder_id} onMoveComplete={onFolderChange}>
										<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
											<FolderPlus className="w-4 h-4 mr-2" />
											Move to Folder
										</DropdownMenuItem>
									</MoveToFolderDialog>

									<DropdownMenuItem onClick={handleTogglePrivacy}>
										{video.is_public ? <Lock className="w-4 h-4 mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
										{video.is_public ? "Make Private" : "Make Public"}
									</DropdownMenuItem>

									<DropdownMenuSeparator />

									<DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600 focus:text-red-600">
										<Trash2 className="w-4 h-4 mr-2" /> {isDeleting ? "Deleting..." : "Delete from Library"}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</Card>

				{/* Video Player Modal */}
				<Dialog open={isPlaying} onOpenChange={setIsPlaying}>
					<DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
						<DialogHeader className="pb-4">
							<DialogTitle>{video.title}</DialogTitle>
						</DialogHeader>
						<div className="flex-1 min-h-0">
							<VideoPlayer videoId={video.id} isOwner={isOwner} autoPlay={true} />
						</div>
					</DialogContent>
				</Dialog>
			</>
		);
	}

	// Grid view layout (original)
	return (
		<Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300">
			{/* Video Thumbnail/Player */}
			<div className="relative aspect-video bg-gray-900">
				{isPlaying ? (
					<VideoPlayer videoId={video.id} isOwner={isOwner} autoPlay={true} />
				) : (
					<>
						{/* Thumbnail Preview */}
						<div
							className={cn(
								"w-full h-full flex items-center justify-center bg-linear-to-br from-gray-800 to-gray-900",
								canPlay && "cursor-pointer group hover:from-gray-700 hover:to-gray-800 transition-colors"
							)}
							onClick={() => canPlay && setIsPlaying(true)}>
							<div className="text-center">
								<div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
									<Play className="w-8 h-8 text-white ml-1" />
								</div>
								<p className="text-white/80 text-sm">Click to play</p>
							</div>
						</div>

						{/* Video Info Overlay */}
						<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4">
							<div className="flex items-center justify-between text-white">
								<div className="flex items-center space-x-3">
									<span className="flex items-center text-sm">
										<HardDrive className="w-4 h-4 mr-1" />
										{formatFileSize(video.compressed_size)}
									</span>
								</div>
								<div className="flex items-center">
									{video.is_public ? <Globe className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-gray-400" />}
								</div>
							</div>
						</div>

						{/* Status Badge */}
						<div className="absolute top-4 left-4">
							{video.status === "completed" ? (
								<Badge className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
									<CheckCircle className="w-4 h-4 mr-1" /> Ready
								</Badge>
							) : video.status === "processing" ? (
								<Badge className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
									<Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing
								</Badge>
							) : (
								<Badge className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">Pending</Badge>
							)}
						</div>
					</>
				)}
			</div>

			{/* Video Details */}
			<div className="px-4">
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold text-gray-900 truncate" title={video.title}>
							{video.title}
						</h3>
						{video.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{video.description}</p>}

						{/* Caption Display */}
						{video.caption && (
							<p className="text-sm text-gray-600 mt-2 line-clamp-2 flex items-start">
								<MessageSquare className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
								{video.caption}
							</p>
						)}

						{/* Folder Badge */}
						{video.folder && (
							<Badge
								variant="outline"
								className="text-xs mt-2 inline-flex items-center"
								style={{
									borderColor: video.folder.color,
									color: video.folder.color,
									backgroundColor: `${video.folder.color}10`,
								}}>
								<Folder className="w-3 h-3 mr-1" />
								{video.folder.name}
							</Badge>
						)}
					</div>

					{/* Actions Dropdown */}
					{isOwner && (
						<DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon">
									<MoreVertical className="w-4 h-4 text-gray-600" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleDownload}>
									<Download className="w-4 h-4 mr-2" /> Download from Drive
								</DropdownMenuItem>

								<DropdownMenuItem onClick={handleShare}>
									<Link2 className="w-4 h-4 mr-2" /> Copy Share Link
								</DropdownMenuItem>

								<MoveToFolderDialog videoId={video.id} videoTitle={video.title} currentFolderId={video.folder_id} onMoveComplete={onFolderChange}>
									<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
										<FolderPlus className="w-4 h-4 mr-2" />
										Move to Folder
									</DropdownMenuItem>
								</MoveToFolderDialog>

								<DropdownMenuItem onClick={handleTogglePrivacy}>
									{video.is_public ? <Lock className="w-4 h-4 mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
									{video.is_public ? "Make Private" : "Make Public"}
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600 focus:text-red-600">
									<Trash2 className="w-4 h-4 mr-2" /> {isDeleting ? "Deleting..." : "Delete from Library"}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>

				{/* Stats & Info */}
				<div className="flex items-center justify-between text-sm text-gray-500">
					<div className="flex items-center space-x-4">
						<span className="flex items-center" title={`Uploaded ${dateInfo.relative}`}>
							<Calendar className="w-4 h-4 mr-1" /> {dateInfo.full}
						</span>

						<span className="flex items-center">
							<Eye className="w-4 h-4 mr-1" /> {video.views_count.toLocaleString()} views
						</span>
					</div>

					{/* Compression Stats */}
					{video.original_size && video.compressed_size && (
						<div className="text-right">
							<div className="font-medium text-green-600">
								↓{Math.round(((video.original_size - video.compressed_size) / video.original_size) * 100)}% smaller
							</div>
							<div className="text-xs text-gray-400">
								{formatFileSize(video.original_size)} → {formatFileSize(video.compressed_size)}
							</div>
						</div>
					)}
				</div>

				{/* Progress Bar for Processing */}
				{video.status === "processing" && (
					<div className="mt-3">
						<Progress value={75} className="w-full" />
						<p className="text-xs text-gray-500 mt-1 text-center">Compressing and uploading...</p>
					</div>
				)}

				{/* Quick Actions for Non-Owners */}
				{!isOwner && video.is_public && (
					<div className="mt-4 flex space-x-2">
						<Button variant="outline" className="flex-1" onClick={handleShare}>
							<Link2 className="w-4 h-4 mr-2" /> Share
						</Button>
						<Button variant="secondary" className="flex-1" onClick={() => setIsPlaying(true)}>
							<Play className="w-4 h-4 mr-2" /> Play
						</Button>
					</div>
				)}

				{/* Message for Private Videos to Guests */}
				{!isOwner && !video.is_public && (
					<div className="mt-4 p-4 bg-gray-100 rounded-lg text-center">
						<p className="text-sm text-gray-600">This video is private</p>
					</div>
				)}
			</div>
		</Card>
	);
}
