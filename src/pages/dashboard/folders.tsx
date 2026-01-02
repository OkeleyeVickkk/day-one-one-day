import { useState, useEffect } from "react";
import { Folder, FolderPlus, Video, MoreVertical, Star, Trash2, Edit2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { DriveFolderService } from "../../services/driveFolders";
import type { Folder as FolderType } from "../../types/database";

export default function FoldersPage() {
	const [folders, setFolders] = useState<FolderType[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<"name" | "videos" | "date">("date");

	useEffect(() => {
		loadFolders();
	}, []);

	async function loadFolders() {
		setLoading(true);
		const data = await DriveFolderService.getFolders();
		setFolders(data);
		setLoading(false);
	}

	const filteredFolders = folders
		.filter((folder) => folder.name.toLowerCase().includes(searchQuery.toLowerCase()))
		.sort((a, b) => {
			if (sortBy === "name") return a.name.localeCompare(b.name);
			if (sortBy === "videos") return (b.video_count || 0) - (a.video_count || 0);
			return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
		});

	const handleSetDefault = async (folderId: string) => {
		try {
			await DriveFolderService.setDefaultFolder(folderId);
			loadFolders();
		} catch (error) {
			console.error("Failed to set default folder:", error);
		}
	};

	const handleDeleteFolder = async (folderId: string) => {
		if (!confirm("Are you sure you want to delete this folder? Videos will be moved to root.")) return;

		try {
			await DriveFolderService.deleteFolder(folderId);
			loadFolders();
		} catch (error) {
			console.error("Failed to delete folder:", error);
		}
	};

	return (
		<div className="container mx-auto p-6">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Folders</h1>
					<p className="text-gray-600 mt-2">Organize your videos in Google Drive folders</p>
				</div>
				<Button onClick={() => setShowCreateDialog(true)}>
					<FolderPlus className="w-4 h-4 mr-2" />
					New Folder
				</Button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div className="bg-white p-6 rounded-xl border border-gray-200">
					<div className="flex items-center">
						<div className="p-3 bg-blue-100 rounded-lg mr-4">
							<Folder className="w-6 h-6 text-blue-600" />
						</div>
						<div>
							<p className="text-sm text-gray-600">Total Folders</p>
							<p className="text-2xl font-semibold text-gray-900">{folders.length}</p>
						</div>
					</div>
				</div>
				<div className="bg-white p-6 rounded-xl border border-gray-200">
					<div className="flex items-center">
						<div className="p-3 bg-green-100 rounded-lg mr-4">
							<Video className="w-6 h-6 text-green-600" />
						</div>
						<div>
							<p className="text-sm text-gray-600">Total Videos</p>
							<p className="text-2xl font-semibold text-gray-900">{folders.reduce((sum, f) => sum + (f.video_count || 0), 0)}</p>
						</div>
					</div>
				</div>
				<div className="bg-white p-6 rounded-xl border border-gray-200">
					<div className="flex items-center">
						<div className="p-3 bg-purple-100 rounded-lg mr-4">
							<Star className="w-6 h-6 text-purple-600" />
						</div>
						<div>
							<p className="text-sm text-gray-600">Default Folder</p>
							<p className="text-2xl font-semibold text-gray-900">{folders.find((f) => f.is_default)?.name || "Not set"}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Controls */}
			<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
				<div className="flex flex-col md:flex-row gap-4">
					<div className="flex-1">
						<Input placeholder="Search folders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-md" />
					</div>
					<div className="flex items-center space-x-2">
						<span className="text-sm text-gray-600">Sort by:</span>
						<div className="flex bg-gray-100 rounded-lg p-1">
							{(["name", "videos", "date"] as const).map((sort) => (
								<button
									key={sort}
									onClick={() => setSortBy(sort)}
									className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
										sortBy === sort ? "bg-white shadow-sm" : "hover:bg-gray-200"
									}`}>
									{sort === "name" && "Name"}
									{sort === "videos" && "Videos"}
									{sort === "date" && "Date"}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Folders Table */}
			<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Folder</TableHead>
							<TableHead>Videos</TableHead>
							<TableHead>Created</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							Array.from({ length: 3 }).map((_, i) => (
								<TableRow key={i}>
									<TableCell>
										<div className="flex items-center animate-pulse">
											<div className="w-10 h-10 rounded-lg bg-gray-200 mr-3"></div>
											<div className="h-4 bg-gray-200 rounded w-32"></div>
										</div>
									</TableCell>
									<TableCell>
										<div className="h-4 bg-gray-200 rounded w-16"></div>
									</TableCell>
									<TableCell>
										<div className="h-4 bg-gray-200 rounded w-24"></div>
									</TableCell>
									<TableCell>
										<div className="h-6 bg-gray-200 rounded w-20"></div>
									</TableCell>
									<TableCell>
										<div className="h-8 bg-gray-200 rounded w-20 ml-auto"></div>
									</TableCell>
								</TableRow>
							))
						) : filteredFolders.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-12">
									<Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-900 font-medium">No folders found</p>
									<p className="text-gray-600 mt-1">{searchQuery ? "Try a different search" : "Create your first folder"}</p>
								</TableCell>
							</TableRow>
						) : (
							filteredFolders.map((folder) => (
								<TableRow key={folder.id}>
									<TableCell>
										<div className="flex items-center">
											<div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: `${folder.color}20` }}>
												<Folder className="w-5 h-5" style={{ color: folder.color }} />
											</div>
											<div>
												<div className="font-medium flex items-center">
													{folder.name}
													{folder.is_default && <Star className="w-4 h-4 ml-2 fill-yellow-400 text-yellow-400" />}
												</div>
												<div className="text-sm text-gray-500">{folder.drive_folder_id.slice(0, 8)}...</div>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="outline">{folder.video_count || 0} videos</Badge>
									</TableCell>
									<TableCell className="text-gray-600">{new Date(folder.created_at).toLocaleDateString()}</TableCell>
									<TableCell>
										<Badge variant={folder.is_default ? "default" : "secondary"}>{folder.is_default ? "Default" : "Active"}</Badge>
									</TableCell>
									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon">
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
												<DropdownMenuItem>
													<Edit2 className="w-4 h-4 mr-2" />
													Rename
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem onClick={() => handleDeleteFolder(folder.id)} className="text-red-600 focus:text-red-600">
													<Trash2 className="w-4 h-4 mr-2" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Create Folder Dialog */}
			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Folder</DialogTitle>
						<DialogDescription>Create a new folder in your Google Drive to organize videos</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<p className="text-sm text-gray-600">Folder creation form coming soon</p>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowCreateDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => {
								setShowCreateDialog(false);
								loadFolders();
							}}>
							Create Folder
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
