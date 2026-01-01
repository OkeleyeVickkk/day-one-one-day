import { useState } from "react";
import { Outlet } from "react-router";
import DashboardSidebar from "../common/dashboard-sidebar";
import DashboardHeader from "../common/dashboard-header";

export default function DashboardLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="flex h-screen bg-gray-100">
			{/* Mobile sidebar overlay */}
			{sidebarOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

			{/* Sidebar */}
			<div
				className={`
				fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
				lg:translate-x-0 lg:static lg:inset-0
				${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
			`}>
				<DashboardSidebar onClose={() => setSidebarOpen(false)} />
			</div>

			{/* Main content */}
			<div className="flex flex-col flex-1 min-w-0">
				<DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
				<main className="flex-1 overflow-y-auto p-4 lg:p-6">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
