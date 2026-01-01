import { useLocation } from "react-router";
import { _router } from "../../routes/_router";
import { ActionButton } from "../base/action-button";

const navigation = [
	{ name: "Dashboard", href: _router.dashboard.index, icon: "🏠" },
	{ name: "Settings", href: _router.dashboard.settings, icon: "⚙️" },
	// Add more navigation items as needed
];

interface DashboardSidebarProps {
	onClose?: () => void;
}

export default function DashboardSidebar({ onClose }: DashboardSidebarProps) {
	const location = useLocation();

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between h-16 px-4 bg-blue-600">
				<h1 className="text-xl font-bold text-white">Dashboard</h1>
				{/* Close button for mobile */}
				<ActionButton onClick={onClose} variant="ghost" size="icon" className="text-white hover:bg-blue-700 lg:hidden">
					<span className="sr-only">Close sidebar</span>✕
				</ActionButton>
			</div>
			<nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
				{navigation.map((item) => (
					<ActionButton
						key={item.name}
						href={item.href}
						onClick={onClose} // Close sidebar on mobile when navigating
						variant="ghost"
						className={`w-full justify-start ${
							location.pathname === item.href ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
						}`}>
						<span className="mr-3 text-lg">{item.icon}</span>
						<span className="truncate">{item.name}</span>
					</ActionButton>
				))}
			</nav>
		</div>
	);
}
