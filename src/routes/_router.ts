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
		callback: "/auth/callback",
	},
	dashboard: {
		index: "/dashboard",
		settings: "/dashboard/settings",
	},
	share: "/share/:token",
	video: "/v/:share_hash",
	profile: "/@:username",
	notFound: "*",
};
