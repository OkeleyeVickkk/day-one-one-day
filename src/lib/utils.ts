import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number | null): string {
	if (!bytes || bytes === 0) return "0 B";

	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));

	return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function formatDuration(seconds: number | null): string {
	if (!seconds) return "--:--";

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}

	return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function formatDate(dateString: string): {
	relative: string;
	full: string;
	time: string;
	datetime: string;
} {
	const date = new Date(dateString);

	return {
		relative: formatDistanceToNow(date, { addSuffix: true }),
		full: date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}),
		time: date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		}),
		datetime: date.toISOString(),
	};
}

export function generateShareUrl(shareHash: string): string {
	return `${window.location.origin}/v/${shareHash}`;
}

export function getVideoThumbnail(_videoId: string): string {
	return `https://ui-avatars.com/api/?name=Video&background=3b82f6&color=fff&size=256`;
}
