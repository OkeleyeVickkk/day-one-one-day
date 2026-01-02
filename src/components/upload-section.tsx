import { useState, useRef, useEffect } from "react";
import { Upload, Video, Sparkles, HardDrive, Folder, Star, X, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { compressVideo } from "../lib/ffmpeg";
import { uploadToGoogleDrive } from "../lib/google-drive";
import { supabase } from "../lib/supabaseClient";
import { DriveFolderService } from "../services/driveFolders";
import { cn } from "../lib/utils";

interface UploadSectionProps {
	onComplete?: () => void;
	defaultFolderId?: string | null;
	isOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
}

const QUALITY_PRESETS = [
	{
		id: "low",
		name: "Small Size",
		description: "480p • Best for sharing",
		compression: "High",
	},
	{
		id: "medium",
		name: "Balanced",
		description: "720p • Recommended",
		compression: "Medium",
	},
	{
		id: "high",
		name: "Best Quality",
		description: "1080p • Minimal compression",
		compression: "Low",
	},
];

export default function UploadSection({ onComplete, defaultFolderId, isOpen, onOpenChange }: UploadSectionProps) {
	const [modalOpen, setModalOpen] = useState(false);

	// Use external state if provided, otherwise use internal state
	const effectiveModalOpen = isOpen !== undefined ? isOpen : modalOpen;
	const handleModalChange = (open: boolean) => {
		if (onOpenChange !== undefined) {
			onOpenChange(open);
		} else {
			setModalOpen(open);
		}
	};
	const [uploading, setUploading] = useState(false);
	const [compressing, setCompressing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [videoInfo, setVideoInfo] = useState({
		title: "",
		caption: "",
		isPublic: true,
		quality: "medium",
		selectedFolderId: defaultFolderId || null,
	});
	const [folders, setFolders] = useState<any[]>([]);
	const [estimatedReduction, setEstimatedReduction] = useState<number | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (effectiveModalOpen) {
			loadFolders();
		}
	}, [effectiveModalOpen]);

	async function loadFolders() {
		const userFolders = await DriveFolderService.getFolders();
		setFolders(userFolders);
	}

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setSelectedFile(file);

		// Extract video title from filename
		const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
		setVideoInfo((prev) => ({ ...prev, title: fileName }));

		// Estimate compression
		if (file.size > 0) {
			const reduction = videoInfo.quality === "low" ? 80 : videoInfo.quality === "medium" ? 60 : 40;
			setEstimatedReduction(reduction);
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) return;

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			setCompressing(true);
			setProgress(10);

			// Get selected folder
			let targetFolder = folders.find((f) => f.id === videoInfo.selectedFolderId);
			let driveFolderId = targetFolder?.drive_folder_id || "root";

			// 1. Compress video
			const compressedFile = await compressVideo(selectedFile, videoInfo.quality as any);
			setProgress(50);

			setCompressing(false);
			setUploading(true);
			setProgress(70);

			// 2. Get Google token
			const {
				data: { session },
			} = await supabase.auth.getSession();
			const token = session?.provider_token;

			if (!token) {
				throw new Error("Please connect Google Drive first");
			}

			// 3. Upload to Google Drive (in selected folder)
			const driveResponse = await uploadToGoogleDrive(compressedFile, {
				name: videoInfo.title || compressedFile.name,
				folderId: driveFolderId,
			});
			setProgress(90);

			// 4. Save metadata to Supabase
			await supabase.from("videos").insert({
				owner_id: user.id,
				title: videoInfo.title || selectedFile.name,
				caption: videoInfo.caption || null,
				folder_id: videoInfo.selectedFolderId,
				original_size: selectedFile.size,
				compressed_size: compressedFile.size,
				compression_ratio: ((selectedFile.size - compressedFile.size) / selectedFile.size) * 100,
				drive_file_id: driveResponse.driveFileId,
				is_public: videoInfo.isPublic,
				status: "completed",
			});

			setProgress(100);
			setUploading(false);

			// Reset state
			setSelectedFile(null);
			setVideoInfo({
				title: "",
				caption: "",
				isPublic: true,
				quality: "medium",
				selectedFolderId: defaultFolderId || null,
			});
			setProgress(0);
			handleModalChange(false);

			if (onComplete) onComplete();
		} catch (error: any) {
			console.error("Upload failed:", error);
			alert(`Error: ${error.message}`);
			setCompressing(false);
			setUploading(false);
			setProgress(0);
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
	};

	return (
		<Dialog open={effectiveModalOpen} onOpenChange={handleModalChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>📤 Upload Video</DialogTitle>
					<DialogDescription>Compress and save videos to your Google Drive</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* File Selection */}
					<div className="space-y-4">
						<div
							className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
							onClick={() => !uploading && !compressing && fileInputRef.current?.click()}>
							<input
								ref={fileInputRef}
								type="file"
								accept="video/*"
								className="hidden"
								onChange={handleFileSelect}
								disabled={uploading || compressing}
							/>

							{selectedFile ? (
								<div className="space-y-4">
									<div className="flex items-center justify-center">
										<Video className="w-12 h-12 text-blue-500" />
									</div>
									<div>
										<p className="font-medium">{selectedFile.name}</p>
										<p className="text-sm text-gray-500 mt-1">
											{formatFileSize(selectedFile.size)}
											{estimatedReduction && (
												<span className="ml-2 text-green-600">→ Estimated: {formatFileSize(selectedFile.size * (1 - estimatedReduction / 100))}</span>
											)}
										</p>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={(e) => {
											e.stopPropagation();
											setSelectedFile(null);
										}}>
										<X className="w-4 h-4 mr-2" />
										Change File
									</Button>
								</div>
							) : (
								<div className="py-8">
									<Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-600 font-medium">Click to select a video file</p>
									<p className="text-sm text-gray-500 mt-1">MP4, WebM, and other video formats supported</p>
								</div>
							)}
						</div>
					</div>

					{selectedFile && (
						<>
							{/* Title Input */}
							<div className="space-y-2">
								<Label>Video Title</Label>
								<Input
									value={videoInfo.title}
									onChange={(e) => setVideoInfo({ ...videoInfo, title: e.target.value })}
									placeholder="Enter video title"
									disabled={uploading || compressing}
								/>
							</div>

							{/* Caption Input */}
							<div className="space-y-2">
								<Label>Caption (Optional)</Label>
								<Textarea
									value={videoInfo.caption}
									onChange={(e) => setVideoInfo({ ...videoInfo, caption: e.target.value })}
									placeholder="Add a description or caption for your video"
									className="min-h-20"
									disabled={uploading || compressing}
								/>
							</div>

							{/* Folder Selection */}
							<div className="space-y-2">
								<Label>
									<Folder className="w-4 h-4 inline mr-2" />
									Save to Folder
								</Label>
								<Select
									value={videoInfo.selectedFolderId || "root"}
									onValueChange={(value) =>
										setVideoInfo({
											...videoInfo,
											selectedFolderId: value === "root" ? null : value,
										})
									}
									disabled={uploading || compressing}>
									<SelectTrigger>
										<SelectValue placeholder="Select a folder" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="root">
											<div className="flex items-center">All Videos (Root)</div>
										</SelectItem>
										{folders.map((folder) => (
											<SelectItem key={folder.id} value={folder.id}>
												<div className="flex items-center">
													<div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: folder.color }} />
													{folder.name}
													{folder.is_default && <Star className="w-3 h-3 ml-2 fill-yellow-400 text-yellow-400" />}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-sm text-gray-500">Organize your videos in Google Drive folders</p>
							</div>

							{/* Quality Selection */}
							<div className="space-y-2">
								<Label>
									<Sparkles className="w-4 h-4 inline mr-2" />
									Compression Quality
								</Label>
								<div className="space-y-2">
									{QUALITY_PRESETS.map((preset) => (
										<div
											key={preset.id}
											className={cn(
												"border rounded-lg p-3 cursor-pointer transition-colors",
												videoInfo.quality === preset.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
											)}
											onClick={() => setVideoInfo({ ...videoInfo, quality: preset.id })}>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">{preset.name}</p>
													<p className="text-sm text-gray-500">{preset.description}</p>
												</div>
												<Badge variant="secondary">{preset.compression}</Badge>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Privacy Toggle */}
							<div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
								<div className="flex-1">
									<p className="font-medium text-sm">Privacy</p>
									<p className="text-sm text-gray-500">{videoInfo.isPublic ? "Anyone can view" : "Only you can view"}</p>
								</div>
								<Button
									variant={videoInfo.isPublic ? "default" : "outline"}
									size="sm"
									onClick={() =>
										setVideoInfo({
											...videoInfo,
											isPublic: !videoInfo.isPublic,
										})
									}
									disabled={uploading || compressing}>
									{videoInfo.isPublic ? (
										<>
											<Globe className="w-4 h-4 mr-2" />
											Public
										</>
									) : (
										<>
											<HardDrive className="w-4 h-4 mr-2" />
											Private
										</>
									)}
								</Button>
							</div>

							{/* Progress Bar */}
							{(uploading || compressing) && (
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>{compressing ? "Compressing..." : "Uploading..."}</span>
										<span>{progress}%</span>
									</div>
									<Progress value={progress} />
								</div>
							)}
						</>
					)}

					{/* Action Buttons */}
					<div className="flex gap-3 justify-end pt-4 border-t">
						<Button variant="outline" onClick={() => handleModalChange(false)} disabled={uploading || compressing}>
							Cancel
						</Button>
						<Button onClick={handleUpload} disabled={!selectedFile || uploading || compressing}>
							{uploading || compressing ? (
								<>
									<Upload className="w-4 h-4 mr-2" />
									{compressing ? "Compressing..." : "Uploading..."}
								</>
							) : (
								<>
									<Upload className="w-4 h-4 mr-2" />
									Upload
								</>
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
