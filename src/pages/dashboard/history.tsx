import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/auth-context";
import { Spinner } from "../../components/ui/spinner";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import type { Video } from "../../types/video";

export default function History() {
	const { user } = useAuth();
	const [videos, setVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("");

	useEffect(() => {
		if (user) {
			fetchVideos();
		}
	}, [user]);

	const fetchVideos = async () => {
		try {
			setLoading(true);
			if (!user) return;

			let query = supabase.from("videos").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });

			if (statusFilter && statusFilter !== "all") {
				query = query.eq("status", statusFilter);
			}

			const { data, error } = await query;

			if (error) throw error;

			let filteredVideos = data || [];

			// Filter by search term (search by video ID)
			if (searchTerm) {
				filteredVideos = filteredVideos.filter((v) => v.id.toLowerCase().includes(searchTerm.toLowerCase()));
			}

			// Filter by date range
			if (dateFrom) {
				filteredVideos = filteredVideos.filter((v) => new Date(v.created_at) >= new Date(dateFrom));
			}
			if (dateTo) {
				filteredVideos = filteredVideos.filter((v) => new Date(v.created_at) <= new Date(dateTo));
			}

			setVideos(filteredVideos);
		} catch (error) {
			console.error("Error fetching videos:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (videoId: string) => {
		if (!confirm("Are you sure you want to delete this video?")) return;

		try {
			const { error } = await supabase.from("videos").delete().eq("id", videoId);

			if (error) throw error;

			setVideos(videos.filter((v) => v.id !== videoId));
		} catch (error) {
			console.error("Error deleting video:", error);
		}
	};

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const getStatusColor = (status?: string) => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-800";
			case "compressing":
				return "bg-blue-100 text-blue-800";
			case "uploading":
				return "bg-yellow-100 text-yellow-800";
			case "failed":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (loading) {
		return <Spinner />;
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Video History</h1>
				<p className="text-gray-600 mt-1">View and manage all your uploaded videos</p>
			</div>

			{/* Filters */}
			<div className="bg-white p-6 rounded-lg shadow space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Input
						type="text"
						placeholder="Search videos..."
						value={searchTerm}
						onChange={(e) => {
							setSearchTerm(e.target.value);
						}}
					/>
					<Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From date" />
					<Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To date" />
					<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
						<option value="">All Statuses</option>
						<option value="completed">Completed</option>
						<option value="compressing">Compressing</option>
						<option value="uploading">Uploading</option>
						<option value="failed">Failed</option>
					</select>
				</div>
				<Button onClick={fetchVideos} className="w-full">
					Apply Filters
				</Button>
			</div>

			{/* Videos Table */}
			{videos.length === 0 ? (
				<div className="bg-white p-12 rounded-lg shadow text-center">
					<p className="text-gray-600">No videos found</p>
				</div>
			) : (
				<div className="bg-white rounded-lg shadow overflow-hidden">
					<table className="w-full">
						<thead className="bg-gray-50 border-b">
							<tr>
								<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">File Name</th>
								<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Size</th>
								<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Compression</th>
								<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
								<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
								<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{videos.map((video) => (
								<tr key={video.id} className="hover:bg-gray-50">
									<td className="px-6 py-4 text-sm text-gray-900">{video.title}</td>
									<td className="px-6 py-4 text-sm text-gray-600">{formatBytes(video.compressed_size || 0)}</td>
									<td className="px-6 py-4 text-sm text-gray-600">{new Date(video.created_at).toLocaleDateString()}</td>
									<td className="px-6 py-4 text-sm">
										<Badge className={getStatusColor(video.status)}>{video.status || "unknown"}</Badge>
									</td>
									<td className="px-6 py-4 text-sm">
										<Button onClick={() => handleDelete(video.id)} variant="destructive" size="sm">
											Delete
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
