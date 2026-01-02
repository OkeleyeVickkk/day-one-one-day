import { useState } from "react";
import { Folder, Move } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { DriveFolderService } from "../../services/driveFolders";

interface MoveToFolderDialogProps {
	videoId: string;
	videoTitle: string;
	currentFolderId?: string | null;
	onMoveComplete?: () => void;
	children: React.ReactNode;
}

export default function MoveToFolderDialog({ videoId, videoTitle, currentFolderId, onMoveComplete, children }: MoveToFolderDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId || null);
	const [folders, setFolders] = useState<any[]>([]);

	const loadFolders = async () => {
		const userFolders = await DriveFolderService.getFolders();
		setFolders(userFolders);
	};

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		if (isOpen) {
			loadFolders();
		}
	};

	const handleMove = async () => {
		setLoading(true);
		try {
			await DriveFolderService.moveVideoToFolder(videoId, selectedFolderId);
			setOpen(false);
			if (onMoveComplete) onMoveComplete();
		} catch (error) {
			console.error("Failed to move video:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center">
						<Move className="w-5 h-5 mr-2" />
						Move Video
					</DialogTitle>
					<DialogDescription>Move "{videoTitle}" to a different folder</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<div className="space-y-3 max-h-60 overflow-y-auto pr-2">
						{/* Root option */}
						<button
							onClick={() => setSelectedFolderId(null)}
							className={`w-full flex items-center p-3 rounded-lg border transition-all ${
								selectedFolderId === null ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
							}`}>
							<div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
								<Folder className="w-4 h-4 text-gray-600" />
							</div>
							<div className="text-left">
								<div className="font-medium">All Videos (Root)</div>
							</div>
							{selectedFolderId === null && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500"></div>}
						</button>

						{/* User folders */}
						{folders.map((folder) => (
							<button
								key={folder.id}
								onClick={() => setSelectedFolderId(folder.id)}
								className={`w-full flex items-center p-3 rounded-lg border transition-all ${
									selectedFolderId === folder.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
								}`}>
								<div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: `${folder.color}20` }}>
									<Folder className="w-4 h-4" style={{ color: folder.color }} />
								</div>
								<div className="text-left">
									<div className="font-medium">{folder.name}</div>
									<div className="text-sm text-gray-500">
										{folder.video_count || 0} video{(folder.video_count || 0) !== 1 ? "s" : ""}
									</div>
								</div>
								{selectedFolderId === folder.id && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500"></div>}
							</button>
						))}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleMove} disabled={loading || selectedFolderId === currentFolderId}>
						{loading ? "Moving..." : "Move Video"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
