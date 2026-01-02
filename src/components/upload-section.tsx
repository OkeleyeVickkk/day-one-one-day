import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/auth-context";
import { ActionButton } from "./base/action-button";
import { Spinner } from "../components/ui/spinner";
import { uploadToGoogleDrive } from "../lib/google-drive";

interface UploadSectionProps {
	onUploadComplete: () => void;
}

export default function UploadSection({ onUploadComplete }: UploadSectionProps) {
	const { user } = useAuth();
	const [isRecording, setIsRecording] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [progress, setProgress] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const videoRef = useRef<HTMLVideoElement>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});

			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
			}

			const mediaRecorder = new MediaRecorder(stream, {
				mimeType: "video/webm;codecs=vp9",
			});

			const chunks: Blob[] = [];
			mediaRecorder.ondataavailable = (event) => {
				chunks.push(event.data);
			};

			mediaRecorder.onstop = async () => {
				const blob = new Blob(chunks, { type: "video/webm" });
				await processVideo(blob);
			};

			mediaRecorderRef.current = mediaRecorder;
			mediaRecorder.start();
			setIsRecording(true);

			// Auto-stop after 90 seconds
			setTimeout(() => {
				if (mediaRecorder.state === "recording") {
					stopRecording();
				}
			}, 90000);
		} catch (error) {
			console.error("Error starting recording:", error);
			setError("Failed to access camera/microphone");
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
		}

		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
		}
	};

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			// Check if file is within 90 seconds
			const video = document.createElement("video");
			video.preload = "metadata";
			video.onloadedmetadata = () => {
				if (video.duration > 90) {
					setError("Video must be 90 seconds or less");
					return;
				}
				setSelectedFile(file);
				setError(null);
			};
			video.src = URL.createObjectURL(file);
		}
	};

	const processVideo = async (blob: Blob) => {
		// Skip compression - upload directly
		await uploadVideo(blob);
	};

	const uploadVideo = async (blob: Blob) => {
		setIsUploading(true);
		setProgress("Saving your video...");

		try {
			if (!user) throw new Error("Not authenticated");

			const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
			const fileName = `${user.id}_${today}.mp4`;

			// Create File from Blob
			const file = new File([blob], fileName, { type: "video/mp4" });

			// Upload to Google Drive
			const { driveFileId } = await uploadToGoogleDrive(file, {
				name: fileName,
				mimeType: "video/mp4",
			});

			// Insert record into videos table
			const { error: insertError } = await supabase.from("videos").insert({
				owner_id: user.id,
				title: `Video from ${new Date().toLocaleDateString()}`,
				drive_file_id: driveFileId,
				compressed_size: blob.size,
				status: "completed",
			});

			if (insertError) throw insertError;

			setProgress("Done! Your video is ready.");
			setTimeout(() => {
				onUploadComplete();
			}, 1500);
		} catch (error: any) {
			console.error("Error uploading video:", error);
			setError(error.message);
		} finally {
			setIsUploading(false);
			setSelectedFile(null);
		}
	};

	const handleUploadFile = async () => {
		if (selectedFile) {
			await processVideo(selectedFile);
		}
	};

	return (
		<div className="bg-white p-6 rounded-lg shadow">
			<h2 className="text-xl font-semibold text-gray-900 mb-4">Record or Upload Your Daily Video</h2>

			{error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

			{isUploading && (
				<div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<div className="flex items-center space-x-3">
						<Spinner />
						<div>
							<p className="text-blue-900 font-medium">{progress}</p>
							<p className="text-blue-700 text-sm">Please keep your browser open</p>
						</div>
					</div>
				</div>
			)}

			<div className="space-y-4">
				<div>
					<h3 className="font-medium text-gray-700 mb-2">Record from Camera</h3>
					<div className="flex items-center space-x-4">
						<video ref={videoRef} className="w-64 h-48 bg-gray-100 rounded" autoPlay muted />
						<div className="flex flex-col space-y-2">
							{!isRecording ? (
								<ActionButton onClick={startRecording}>Start Recording</ActionButton>
							) : (
								<ActionButton onClick={stopRecording} variant="destructive">
									Stop Recording
								</ActionButton>
							)}
							<p className="text-sm text-gray-500">Max 90 seconds - auto-stops</p>
						</div>
					</div>
				</div>

				{/* Upload Section */}
				<div>
					<h3 className="font-medium text-gray-700 mb-2">Or Upload Existing Video</h3>
					<div className="flex items-center space-x-4">
						<input
							type="file"
							accept="video/*"
							onChange={handleFileSelect}
							className="block w-full text-sm text-gray-500
								file:mr-4 file:py-2 file:px-4
								file:rounded-full file:border-0
								file:text-sm file:font-semibold
								file:bg-blue-50 file:text-blue-700
								hover:file:bg-blue-100"
						/>
						{selectedFile && (
							<ActionButton onClick={handleUploadFile} disabled={isUploading}>
								Upload
							</ActionButton>
						)}
					</div>
					<p className="text-sm text-gray-500 mt-1">Max 90 seconds, any video format</p>
				</div>
			</div>
		</div>
	);
}
