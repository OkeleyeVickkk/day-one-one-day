import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface Video {
	id: string;
	title: string;
	url: string;
	created_at: string;
}

export default function History() {
	const [videos, setVideos] = useState<Video[]>([]);

	useEffect(() => {
		const fetchVideos = async () => {
			const { data, error } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
			if (error) console.error(error);
			else setVideos(data || []);
		};
		fetchVideos();
	}, []);

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Video History</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{videos.map((video) => (
					<div key={video.id} className="border rounded p-4">
						<h2 className="font-semibold">{video.title}</h2>
						<p>{new Date(video.created_at).toLocaleDateString()}</p>
						<video src={video.url} controls className="w-full mt-2" />
					</div>
				))}
			</div>
		</div>
	);
}
