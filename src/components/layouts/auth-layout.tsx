import { Outlet } from "react-router";

export default function AuthLayout() {
	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="w-full max-w-md flex items-center justify-center mx-auto min-h-96 h-auto p-8 bg-white rounded-lg shadow-md *:w-full">
				<Outlet />
			</div>
		</div>
	);
}
