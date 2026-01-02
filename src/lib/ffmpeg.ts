import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

export async function loadFFmpeg() {
	if (ffmpeg && ffmpeg.loaded) return ffmpeg;

	ffmpeg = new FFmpeg();

	// Load FFmpeg core
	await ffmpeg.load({
		coreURL: await toBlobURL("https://unpkg.com/@ffmpeg/core@0.12.10/dist/ffmpeg-core.js", "text/javascript"),
		wasmURL: await toBlobURL("https://unpkg.com/@ffmpeg/core@0.12.10/dist/ffmpeg-core.wasm", "application/wasm"),
	});

	return ffmpeg;
}

export async function compressVideo(file: File, quality: "low" | "medium" | "high" = "medium") {
	const ffmpegInstance = await loadFFmpeg();
	if (!ffmpegInstance) throw new Error("Failed to load FFmpeg");

	const inputName = "input.mp4";
	const outputName = "output.mp4";

	// Write file to FFmpeg FS
	await ffmpegInstance.writeFile(inputName, await fetchFile(file));

	// Compression settings
	const commands = {
		low: ["-crf", "28", "-preset", "fast", "-vf", "scale=640:-2"],
		medium: ["-crf", "23", "-preset", "medium", "-vf", "scale=854:-2"],
		high: ["-crf", "18", "-preset", "slow"],
	};

	// Run FFmpeg command
	await ffmpegInstance.exec(["-i", inputName, ...commands[quality], outputName]);

	// Read output (normalize to Uint8Array)
	const out = (await ffmpegInstance.readFile(outputName)) as unknown;
	let bytes: Uint8Array;
	if (out instanceof Uint8Array) {
		bytes = out;
	} else if (out instanceof ArrayBuffer) {
		bytes = new Uint8Array(out);
	} else if (Array.isArray(out)) {
		bytes = new Uint8Array(out as number[]);
	} else {
		bytes = new Uint8Array(out as ArrayBufferLike);
	}

	// Convert to File object (use underlying ArrayBuffer for BlobPart compatibility)
	const buffer = bytes.buffer as ArrayBuffer;
	const blob = new Blob([buffer], { type: "video/mp4" });
	return new File([blob], `compressed_${file.name}`, { type: "video/mp4" });
}
