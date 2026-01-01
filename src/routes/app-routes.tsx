import { createBrowserRouter } from "react-router";
import { _router } from "./_router";
import LandingPageLayout from "../components/layouts/landing-page";
import Index from "../pages/landing";
import AuthLayout from "../components/layouts/auth-layout";
import LoginPage from "../pages/auth/login";
import RegisterPage from "../pages/auth/register";
import EmailVerificationPage from "../pages/auth/email-verification";
import ForgotPasswordPage from "../pages/auth/forgot-password";
import PasswordResetPage from "../pages/auth/password-reset";
import DashboardLayout from "../components/layouts/dashboard-layout";
import NotFoundPage from "../pages/not-found";
import DashboardIndex from "../pages/dashboard";
import ShareView from "../pages/share-view";
import { ProtectedRoute } from "../components/protected-route";
import Settings from "../pages/dashboard/settings";

export const appRouter = createBrowserRouter([
	{
		path: _router.landing.index,
		Component: LandingPageLayout,
		children: [
			{
				index: true,
				Component: () => <Index />,
			},
		],
	},
	{
		path: _router.auth.index,
		Component: AuthLayout,
		children: [
			{
				path: _router.auth.login,
				Component: () => <LoginPage />,
			},
			{
				path: _router.auth.register,
				Component: () => <RegisterPage />,
			},
			{
				path: _router.auth.emailVerification,
				Component: () => <EmailVerificationPage />,
			},
			{
				path: _router.auth.forgotPassword,
				Component: () => <ForgotPasswordPage />,
			},
			{
				path: _router.auth.passwordReset,
				Component: () => <PasswordResetPage />,
			},
		],
	},
	{
		path: _router.dashboard.index,
		errorElement: <div>Some error occured </div>,
		Component: () => (
			<ProtectedRoute>
				<DashboardLayout />
			</ProtectedRoute>
		),
		children: [
			{
				index: true,
				Component: DashboardIndex,
			},
			{
				index: true,
				Component: Settings,
			},
		],
	},
	{
		path: _router.share,
		Component: () => <ShareView />,
	},
	{
		path: _router.notFound,
		Component: NotFoundPage,
	},
]);
