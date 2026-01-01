export const _router = {
	landing: {
		index: "/",
	},
	auth: {
		index: "/auth",
		login: "/auth/login",
		register: "/auth/register",
		emailVerification: "/auth/verify-email",
		forgotPassword: "/auth/forgot-password",
		passwordReset: "/auth/reset-password",
	},
	dashboard: {
		index: "/dashboard",
		settings: "/dashboard/settings",
	},
	share: "/share/:token",
	notFound: "*",
};
