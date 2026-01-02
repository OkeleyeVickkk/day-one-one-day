export type Folder = {
	id: string;
	user_id: string;
	drive_folder_id: string;
	name: string;
	color: string;
	icon: string;
	is_default: boolean;
	created_at: string;
	updated_at: string;
	video_count?: number;
};

export type Video = {
	id: string;
	owner_id: string;
	folder_id: string | null;
	title: string;
	caption: string | null;
	tags: string[];
	description?: string | null;
	original_size: number | null;
	compressed_size: number | null;
	compression_ratio: number | null;
	drive_file_id: string;
	is_public: boolean;
	share_hash: string | null;
	views_count: number;
	status: string;
	duration?: number;
	created_at: string;
	folder?: Folder | null;
};
