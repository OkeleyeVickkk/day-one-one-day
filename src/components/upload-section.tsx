import { useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/auth-context";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { ActionButton } from "./base/action-button";
import { LoadingSpinner } from "./loading-spinner";

interface UploadSectionProps {
	onUploadComplete: () => void;
}

export default function UploadSection({ onUploadComplete }: UploadSectionProps) {
	const { user } = useAuth();
	const [isRecording, setIsRecording] = useState(false);
	const [isCompressing, setIsCompressing] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [progress, setProgress] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const videoRef = useRef<HTMLVideoElement>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const ffmpegRef = useRef<FFmpeg>(new FFmpeg());

	const loadFFmpeg = useCallback(async () => {
		const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd";
		ffmpegRef.current.on("log", ({ message }) => {
			console.log(message);
		});
		await ffmpegRef.current.load({
			coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
			wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
		});
	}, []);

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
		setIsCompressing(true);
		setProgress("Compressing video...");

		try {
			await loadFFmpeg();

			const inputFileName = "input.webm";
			const outputFileName = "output.mp4";

			await ffmpegRef.current.writeFile(inputFileName, await fetchFile(blob));

			await ffmpegRef.current.exec([
				"-i",
				inputFileName,
				"-c:v",
				"libx264",
				"-preset",
				"slow",
				"-crf",
				"28",
				"-c:a",
				"aac",
				"-b:a",
				"128k",
				"-movflags",
				"+faststart",
				outputFileName,
			]);

			const data = await ffmpegRef.current.readFile(outputFileName);
			const compressedBlob = new Blob([data as any], { type: "video/mp4" });

			await uploadVideo(compressedBlob);
		} catch (error) {
			console.error("Error compressing video:", error);
			setError("Failed to compress video");
			setIsCompressing(false);
		}
	};

	const uploadVideo = async (blob: Blob) => {
		setIsCompressing(false);
		setIsUploading(true);
		setProgress("Uploading video...");

		try {
			if (!user) throw new Error("Not authenticated");

			const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
			const fileName = `${user.id}/${today}.mp4`;

			// Check if video already exists for today
			const { data: existingVideo } = await supabase.from("daily_videos").select("id").eq("user_id", user.id).eq("date", today).single();

			if (existingVideo) {
				setError("You've already uploaded a video for today");
				setIsUploading(false);
				return;
			}

			// Upload to storage
			const { error: uploadError } = await supabase.storage.from("daily-videos").upload(fileName, blob, {
				contentType: "video/mp4",
				upsert: true,
			});

			if (uploadError) throw uploadError;

			// Get video duration
			const duration = await getVideoDuration(blob);

			// Insert record
			const { error: insertError } = await supabase.from("daily_videos").insert({
				user_id: user.id,
				date: today,
				video_path: fileName,
				duration: Math.floor(duration),
				compressed_size: blob.size,
			});

			if (insertError) throw insertError;

			setProgress("Upload complete!");
			onUploadComplete();
		} catch (error: any) {
			console.error("Error uploading video:", error);
			setError(error.message);
		} finally {
			setIsUploading(false);
			setSelectedFile(null);
		}
	};

	const getVideoDuration = (blob: Blob): Promise<number> => {
		return new Promise((resolve) => {
			const video = document.createElement("video");
			video.preload = "metadata";
			video.onloadedmetadata = () => {
				resolve(video.duration);
			};
			video.src = URL.createObjectURL(blob);
		});
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

			{(isCompressing || isUploading) && <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">{progress}</div>}

			<div className="space-y-4">
				{/* Recording Section */}
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
							<ActionButton onClick={handleUploadFile} disabled={isCompressing || isUploading}>
								Upload
							</ActionButton>
						)}
					</div>
					<p className="text-sm text-gray-500 mt-1">Max 90 seconds, any video format</p>
				</div>
			</div>

			{(isCompressing || isUploading) && (
				<div className="mt-4 flex items-center space-x-2">
					<LoadingSpinner />
					<span className="text-sm text-gray-600">{progress}</span>
				</div>
			)}
		</div>
	);
}
