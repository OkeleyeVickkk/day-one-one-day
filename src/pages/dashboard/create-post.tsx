import { useState, useRef } from "react";
import { ActionButton } from "../../components/base/action-button";
import { supabase } from "../../lib/supabaseClient";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";

export default function CreatePost() {
	const [isRecording, setIsRecording] = useState(false);
	const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
	const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadMode, setUploadMode] = useState<"record" | "upload">("record");
	const videoRef = useRef<HTMLVideoElement>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const ffmpegRef = useRef(new FFmpeg());
	const fileInputRef = useRef<HTMLInputElement>(null);

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
			}
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;
			const chunks: Blob[] = [];
			mediaRecorder.ondataavailable = (event) => chunks.push(event.data);
			mediaRecorder.onstop = () => {
				const blob = new Blob(chunks, { type: "video/webm" });
				setVideoBlob(blob);
				if (videoRef.current) {
					videoRef.current.srcObject = null;
					videoRef.current.src = URL.createObjectURL(blob);
				}
			};
			mediaRecorder.start();
			setIsRecording(true);
			// Auto-stop after 30 seconds
			setTimeout(() => {
				if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
					mediaRecorderRef.current.stop();
					setIsRecording(false);
				}
			}, 30000);
		} catch (error) {
			console.error("Error starting recording:", error);
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
		}
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file && file.type.startsWith("video/")) {
			setVideoBlob(file);
			if (videoRef.current) {
				videoRef.current.src = URL.createObjectURL(file);
			}
		}
	};

	const compressVideo = async () => {
		if (!videoBlob) return;
		const ffmpeg = ffmpegRef.current;
		if (!ffmpeg.loaded) {
			await ffmpeg.load({
				coreURL: await toBlobURL("/ffmpeg-core.js", "text/javascript"),
				wasmURL: await toBlobURL("/ffmpeg-core.wasm", "application/wasm"),
			});
		}
		await ffmpeg.writeFile("input.webm", await fetchFile(videoBlob));
		await ffmpeg.exec(["-i", "input.webm", "-vf", "scale=640:480", "-c:v", "libx264", "-crf", "28", "-preset", "fast", "output.mp4"]);
		const data = await ffmpeg.readFile("output.mp4");
		const compressed = new Blob([data as any], { type: "video/mp4" });
		setCompressedBlob(compressed);
	};

	const uploadToDrive = async () => {
		if (!compressedBlob) return;
		setUploading(true);
		console.log("Uploading to Drive...");
		// After upload, save metadata to Supabase
		const { error } = await supabase.from("videos").insert({
			user_id: (await supabase.auth.getUser()).data.user?.id,
			title: `Day ${new Date().toISOString().split("T")[0]}`,
			url: "drive_url_placeholder", // Replace with actual Drive URL
		});
		if (error) console.error(error);
		setUploading(false);
	};

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Create Daily Video</h1>
			<div className="mb-4">
				<RadioGroup value={uploadMode} onValueChange={(value) => setUploadMode(value as "record" | "upload")}>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="record" id="record" />
						<Label htmlFor="record">Record Video</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="upload" id="upload" />
						<Label htmlFor="upload">Upload Video</Label>
					</div>
				</RadioGroup>
			</div>
			<video ref={videoRef} controls className="w-full max-w-md mb-4" />
			{uploadMode === "record" && (
				<>
					{!isRecording ? (
						<ActionButton onClick={startRecording}>Start Recording</ActionButton>
					) : (
						<ActionButton onClick={stopRecording}>Stop Recording</ActionButton>
					)}
				</>
			)}
			{uploadMode === "upload" && (
				<div className="mb-4">
					<ActionButton onClick={() => fileInputRef.current?.click()}>Choose Video File</ActionButton>
					<input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
				</div>
			)}
			{videoBlob && !compressedBlob && (
				<ActionButton onClick={compressVideo} className="ml-4">
					Compress Video
				</ActionButton>
			)}
			{compressedBlob && (
				<ActionButton onClick={uploadToDrive} disabled={uploading} className="ml-4">
					{uploading ? "Uploading..." : "Upload to Drive"}
				</ActionButton>
			)}
		</div>
	);
}
