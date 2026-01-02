// Video types
export interface Video {
	id: string;
	owner_id: string;
	title: string;
	description?: string | null;
	drive_file_id: string;
	compressed_size: number | null;
	original_size?: number | null;
	created_at: string;
	updated_at?: string;
	is_public: boolean;
	share_hash?: string | null;
	status: string;
	views_count: number;
	compression_ratio?: number | null;
	view_count?: number;
}

// Profile/User types
export interface Profile {
	id: string;
	user_id: string;
	username?: string;
	share_token?: string | null;
	default_compression_preset?: string;
	google_drive_connected: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface User {
	id: string;
	email: string;
	full_name?: string | null;
	user_metadata?: Record<string, any>;
}

// Compression settings
export interface CompressionPreset {
	name: string;
	crf: number;
	preset: "ultrafast" | "superfast" | "veryfast" | "faster" | "fast" | "medium" | "slow" | "slower" | "veryslow";
	resolution?: string;
	audioBitrate: string;
	videoBitrate?: string;
	maxSizeMB?: number;
}

export interface CompressionResult {
	file: File;
	originalSize: number;
	compressedSize: number;
	reduction: number;
	duration: number;
	presetUsed: string;
	metadata?: VideoMetadata;
}

export interface VideoMetadata {
	width: number;
	height: number;
	duration: number;
	format: string;
	bitrate: number;
	framerate: number;
}

export interface FFmpegProgress {
	ratio: number;
	time: number;
	speed: number;
	fps: number;
}

export interface UploadState {
	isUploading: boolean;
	progress: number;
	status: "idle" | "uploading" | "compressing" | "uploading_to_drive" | "completed" | "error";
	error?: string;
	videoId?: string;
}
