import { useState } from "react";
import { useNavigate } from "react-router";
import { _router } from "../../routes/_router";
import { useAuth } from "../../contexts/auth-context";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { ActionButton } from "../base/action-button";

interface DashboardHeaderProps {
	onMenuClick?: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
	const { user, signOut } = useAuth();
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const navigate = useNavigate();

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await signOut();
			navigate(_router.auth.login);
		} catch (error) {
			console.error("Error signing out:", error);
			// Even if there's an error, redirect to login
			navigate(_router.auth.login);
		} finally {
			setIsLoggingOut(false);
			setShowLogoutModal(false);
		}
	};

	return (
		<>
			<header className="bg-white shadow-sm border-b border-gray-200">
				<div className="flex items-center justify-between h-16 px-4 lg:px-6">
					<div className="flex items-center">
						{/* Mobile menu button */}
						<ActionButton onClick={onMenuClick} variant="ghost" size="icon" className="lg:hidden mr-3">
							<span className="sr-only">Open sidebar</span>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						</ActionButton>
						<h2 className="text-lg font-semibold text-gray-900">{user?.full_name ? `Welcome back, ${user.full_name}!` : "Welcome back!"}</h2>
					</div>
					<div className="flex items-center space-x-4">
						<ActionButton onClick={() => alert("Notifications would be shown here")} variant="ghost" size="icon" className="hidden sm:flex">
							<span className="sr-only">Notifications</span>
							🔔
						</ActionButton>
						<div className="flex items-center space-x-2">
							<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
								{user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
							</div>
							<span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.full_name || "User"}</span>
						</div>
						<ActionButton onClick={() => setShowLogoutModal(true)} variant="ghost" size="sm">
							Logout
						</ActionButton>
					</div>
				</div>
			</header>

			<Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Logout</DialogTitle>
						<DialogDescription>Are you sure you want to log out? You will need to sign in again to access your account.</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<ActionButton variant="outline" onClick={() => setShowLogoutModal(false)} disabled={isLoggingOut}>
							Cancel
						</ActionButton>
						<ActionButton onClick={handleLogout} disabled={isLoggingOut}>
							{isLoggingOut ? "Logging out..." : "Logout"}
						</ActionButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
