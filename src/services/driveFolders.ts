import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";
import type { Folder } from "../types/database";

export interface CreateFolderData {
	name: string;
	color?: string;
	icon?: string;
	is_default?: boolean;
}

export class DriveFolderService {
	// Create folder in Google Drive and save to database
	static async createFolder(data: CreateFolderData) {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			// Get Google Drive access token
			const { data: session } = await supabase.auth.getSession();
			const accessToken = session?.session?.provider_token;

			if (!accessToken) {
				throw new Error("Google Drive not connected");
			}

			// 1. Create folder in Google Drive
			const driveResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: data.name,
					mimeType: "application/vnd.google-apps.folder",
					parents: ["root"],
				}),
			});

			if (!driveResponse.ok) {
				throw new Error("Failed to create folder in Google Drive");
			}

			const driveFolder = await driveResponse.json();

			// 2. Save to our database
			const { data: folder, error } = await supabase
				.from("folders")
				.insert({
					user_id: user.id,
					drive_folder_id: driveFolder.id,
					name: data.name,
					color: data.color || "#3b82f6",
					icon: data.icon || "folder",
					is_default: data.is_default || false,
				})
				.select()
				.single();

			if (error) throw error;

			toast.success(`Folder "${data.name}" created successfully`);
			return folder;
		} catch (error: any) {
			console.error("Failed to create folder:", error);
			toast.error(error.message || "Failed to create folder");
			throw error;
		}
	}

	// Get user's folders
	static async getFolders() {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return [];

			const { data: folders, error } = await supabase
				.from("folders")
				.select(
					`
          *,
          videos: videos(count)
        `
				)
				.eq("user_id", user.id)
				.order("created_at", { ascending: false });

			if (error) throw error;

			// Transform to include video count
			return folders.map((folder) => ({
				...folder,
				video_count: folder.videos?.[0]?.count || 0,
			}));
		} catch (error) {
			console.error("Failed to fetch folders:", error);
			return [];
		}
	}

	// Delete folder from Google Drive and database
	static async deleteFolder(folderId: string) {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			// Get folder details
			const { data: folder, error: fetchError } = await supabase
				.from("folders")
				.select("drive_folder_id")
				.eq("id", folderId)
				.eq("user_id", user.id)
				.single();

			if (fetchError) throw fetchError;

			// Get access token
			const { data: session } = await supabase.auth.getSession();
			const accessToken = session?.session?.provider_token;

			if (!accessToken) {
				throw new Error("Google Drive not connected");
			}

			// Delete from Google Drive
			const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${folder.drive_folder_id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			if (!driveResponse.ok && driveResponse.status !== 404) {
				throw new Error("Failed to delete folder from Google Drive");
			}

			// Delete from database
			const { error: deleteError } = await supabase.from("folders").delete().eq("id", folderId).eq("user_id", user.id);

			if (deleteError) throw deleteError;

			toast.success("Folder deleted successfully");
			return true;
		} catch (error: any) {
			console.error("Failed to delete folder:", error);
			toast.error(error.message || "Failed to delete folder");
			throw error;
		}
	}

	// Move video to different folder
	static async moveVideoToFolder(videoId: string, folderId: string | null) {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			// Get video and target folder info
			const [{ data: video }, { data: targetFolder }] = await Promise.all([
				supabase.from("videos").select("drive_file_id, folder_id").eq("id", videoId).eq("owner_id", user.id).single(),
				folderId
					? supabase.from("folders").select("drive_folder_id").eq("id", folderId).eq("user_id", user.id).single()
					: Promise.resolve({ data: null }),
			]);

			if (!video) throw new Error("Video not found");

			// Get access token
			const { data: session } = await supabase.auth.getSession();
			const accessToken = session?.session?.provider_token;

			if (!accessToken) {
				throw new Error("Google Drive not connected");
			}

			// Prepare move operation for Google Drive
			const previousParents = video.folder_id ? await this.getFolderDriveId(video.folder_id) : "root";

			const updatePayload: any = {
				addParents: targetFolder?.drive_folder_id || "root",
				removeParents: previousParents,
			};

			// Update in Google Drive
			const driveResponse = await fetch(
				`https://www.googleapis.com/drive/v3/files/${video.drive_file_id}?addParents=${updatePayload.addParents}&removeParents=${updatePayload.removeParents}`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			);

			if (!driveResponse.ok) {
				throw new Error("Failed to move video in Google Drive");
			}

			// Update in database
			const { error } = await supabase.from("videos").update({ folder_id: folderId }).eq("id", videoId).eq("owner_id", user.id);

			if (error) throw error;

			toast.success("Video moved successfully");
			return true;
		} catch (error: any) {
			console.error("Failed to move video:", error);
			toast.error(error.message || "Failed to move video");
			throw error;
		}
	}

	private static async getFolderDriveId(folderId: string): Promise<string> {
		const { data: folder } = await supabase.from("folders").select("drive_folder_id").eq("id", folderId).single();

		return folder?.drive_folder_id || "root";
	}

	// Set default folder
	static async setDefaultFolder(folderId: string) {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			// Remove default from all folders
			await supabase.from("folders").update({ is_default: false }).eq("user_id", user.id);

			// Set new default
			const { error } = await supabase.from("folders").update({ is_default: true }).eq("id", folderId).eq("user_id", user.id);

			if (error) throw error;

			toast.success("Default folder updated");
			return true;
		} catch (error: any) {
			console.error("Failed to set default folder:", error);
			toast.error(error.message || "Failed to set default folder");
			throw error;
		}
	}
}
