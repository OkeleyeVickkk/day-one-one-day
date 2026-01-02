import { useState, useEffect } from "react";
import { Folder, FolderPlus, MoreVertical, Star, Trash2, Edit2, Check, FolderOpen } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { DriveFolderService } from "../../services/driveFolders";
import type { Folder as FolderType } from "../../types/database";
import { cn } from "../../lib/utils";

interface FolderManagerProps {
	onFolderSelect?: (folderId: string | null) => void;
	selectedFolderId?: string | null;
	showCreateButton?: boolean;
	className?: string;
}

const COLORS = [
	"#3b82f6", // blue
	"#10b981", // emerald
	"#8b5cf6", // violet
	"#f59e0b", // amber
	"#ef4444", // red
	"#06b6d4", // cyan
	"#84cc16", // lime
	"#f97316", // orange
];

const ICONS = ["folder", "folder-open", "video", "music", "image", "file", "archive"];

export default function FolderManager({ onFolderSelect, selectedFolderId, showCreateButton = true, className }: FolderManagerProps) {
	const [folders, setFolders] = useState<FolderType[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		color: "#3b82f6",
		icon: "folder",
	});

	useEffect(() => {
		loadFolders();
	}, []);

	async function loadFolders() {
		setLoading(true);
		const folders = await DriveFolderService.getFolders();
		setFolders(folders);
		setLoading(false);
	}

	async function handleCreateFolder() {
		try {
			await DriveFolderService.createFolder(formData);
			setShowCreateDialog(false);
			setFormData({ name: "", color: "#3b82f6", icon: "folder" });
			loadFolders();
		} catch (error) {
			console.error("Failed to create folder:", error);
		}
	}

	async function handleDeleteFolder(folderId: string) {
		if (!confirm("Delete this folder? Videos will be moved to root.")) return;

		try {
			await DriveFolderService.deleteFolder(folderId);
			loadFolders();
		} catch (error) {
			console.error("Failed to delete folder:", error);
		}
	}

	async function handleSetDefault(folderId: string) {
		try {
			await DriveFolderService.setDefaultFolder(folderId);
			loadFolders();
		} catch (error) {
			console.error("Failed to set default folder:", error);
		}
	}

	const rootFolderCount = folders.reduce((sum, f) => sum + (f.video_count || 0), 0);

	return (
		<div className={cn("space-y-4", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="font-semibold text-lg flex items-center">
					<Folder className="w-5 h-5 mr-2" />
					Folders
				</h3>
				{showCreateButton && (
					<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
						<DialogTrigger asChild>
							<Button size="sm" variant="outline">
								<FolderPlus className="w-4 h-4 mr-2" />
								New Folder
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create New Folder</DialogTitle>
								<DialogDescription>Create a new folder in your Google Drive</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="name">Folder Name</Label>
									<Input
										id="name"
										placeholder="My Videos"
										value={formData.name}
										onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									/>
								</div>
								<div className="space-y-2">
									<Label>Color</Label>
									<div className="flex flex-wrap gap-2">
										{COLORS.map((color) => (
											<button
												key={color}
												type="button"
												onClick={() => setFormData({ ...formData, color })}
												className={cn(
													"w-8 h-8 rounded-full border-2 transition-transform",
													formData.color === color ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
												)}
												style={{ backgroundColor: color }}>
												{formData.color === color && <Check className="w-4 h-4 text-white m-auto" />}
											</button>
										))}
									</div>
								</div>
								<div className="space-y-2">
									<Label>Icon</Label>
									<div className="flex flex-wrap gap-2">
										{ICONS.map((icon) => (
											<button
												key={icon}
												type="button"
												onClick={() => setFormData({ ...formData, icon })}
												className={cn(
													"w-10 h-10 rounded-lg border flex items-center justify-center transition-all",
													formData.icon === icon ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
												)}>
												{icon === "folder" && <Folder className="w-5 h-5" />}
												{icon === "folder-open" && <FolderOpen className="w-5 h-5" />}
												{icon === "video" && (
													<div className="w-5 h-5 bg-gray-800 rounded flex items-center justify-center">
														<div className="w-3 h-3 bg-white rounded-sm"></div>
													</div>
												)}
												{/* Add more icons as needed */}
											</button>
										))}
									</div>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setShowCreateDialog(false)}>
									Cancel
								</Button>
								<Button onClick={handleCreateFolder} disabled={!formData.name.trim()}>
									Create Folder
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				)}
			</div>

			{/* Folders List */}
			<div className="space-y-2">
				{/* Root/All Videos */}
				<button
					onClick={() => onFolderSelect?.(null)}
					className={cn(
						"w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-gray-50",
						selectedFolderId === null ? "border-blue-500 bg-blue-50" : "border-gray-200"
					)}>
					<div className="flex items-center">
						<div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
							<Folder className="w-5 h-5 text-gray-600" />
						</div>
						<div className="text-left">
							<div className="font-medium">All Videos</div>
							<div className="text-sm text-gray-500">{rootFolderCount} videos</div>
						</div>
					</div>
					{selectedFolderId === null && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
				</button>

				{/* User Folders */}
				{loading ? (
					<div className="space-y-2">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="flex items-center p-3 animate-pulse">
								<div className="w-10 h-10 rounded-lg bg-gray-200 mr-3"></div>
								<div className="flex-1">
									<div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
									<div className="h-3 bg-gray-200 rounded w-16"></div>
								</div>
							</div>
						))}
					</div>
				) : (
					folders.map((folder) => (
						<div
							key={folder.id}
							className={cn(
								"group flex items-center justify-between p-3 rounded-lg border transition-all",
								selectedFolderId === folder.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
							)}>
							<button onClick={() => onFolderSelect?.(folder.id)} className="flex-1 flex items-center text-left">
								<div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: `${folder.color}20` }}>
									<Folder className="w-5 h-5" style={{ color: folder.color }} />
								</div>
								<div>
									<div className="font-medium flex items-center">
										{folder.name}
										{folder.is_default && <Star className="w-3 h-3 ml-2 fill-yellow-400 text-yellow-400" />}
									</div>
									<div className="text-sm text-gray-500">
										{folder.video_count || 0} video{(folder.video_count || 0) !== 1 ? "s" : ""}
									</div>
								</div>
							</button>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
										<MoreVertical className="w-4 h-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{!folder.is_default && (
										<DropdownMenuItem onClick={() => handleSetDefault(folder.id)}>
											<Star className="w-4 h-4 mr-2" />
											Set as Default
										</DropdownMenuItem>
									)}
									<DropdownMenuItem
										onClick={() => {
											setEditingFolder(folder);
											setShowEditDialog(true);
										}}>
										<Edit2 className="w-4 h-4 mr-2" />
										Rename
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => handleDeleteFolder(folder.id)} className="text-red-600 focus:text-red-600">
										<Trash2 className="w-4 h-4 mr-2" />
										Delete Folder
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							{selectedFolderId === folder.id && <div className="w-2 h-2 rounded-full bg-blue-500 ml-2"></div>}
						</div>
					))
				)}

				{!loading && folders.length === 0 && (
					<div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
						<Folder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
						<p className="text-gray-500">No folders yet</p>
						<p className="text-sm text-gray-400 mt-1">Create your first folder to organize videos</p>
					</div>
				)}
			</div>

			{/* Edit Dialog */}
			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Folder</DialogTitle>
						<DialogDescription>Update folder name and appearance</DialogDescription>
					</DialogHeader>
					{editingFolder && (
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="edit-name">Folder Name</Label>
								<Input
									id="edit-name"
									defaultValue={editingFolder.name}
									onChange={(e) =>
										setEditingFolder({
											...editingFolder,
											name: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Color</Label>
								<div className="flex flex-wrap gap-2">
									{COLORS.map((color) => (
										<button
											key={color}
											type="button"
											onClick={() =>
												setEditingFolder({
													...editingFolder,
													color,
												})
											}
											className={cn(
												"w-8 h-8 rounded-full border-2 transition-transform",
												editingFolder.color === color ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
											)}
											style={{ backgroundColor: color }}>
											{editingFolder.color === color && <Check className="w-4 h-4 text-white m-auto" />}
										</button>
									))}
								</div>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowEditDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={async () => {
								if (!editingFolder) return;
								// Update folder logic here
								setShowEditDialog(false);
								loadFolders();
							}}>
							Save Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
