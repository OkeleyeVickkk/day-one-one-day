import { Outlet } from "react-router";

export default function AuthLayout() {
	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50">
			<div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
				<Outlet />
			</div>
		</div>
	);
}
