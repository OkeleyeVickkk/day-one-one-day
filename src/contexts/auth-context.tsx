import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";

export interface User {
	id: string;
	email: string;
	full_name: string | null;
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		let timeout: number;

		// Get initial session
		const getInitialSession = async () => {
			console.log("AuthContext: Getting initial session...");
			try {
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession();

				if (error) {
					console.error("AuthContext: Error getting session:", error);
					throw error;
				}

				console.log("AuthContext: Session result:", session ? "has session" : "no session");

				if (mounted) {
					if (session?.user) {
						console.log("AuthContext: Fetching user profile for:", session.user.id);
						await fetchUserProfile(session.user.id, session.user.email!);
					} else {
						console.log("AuthContext: No session, setting user to null");
						setUser(null);
					}
				}
			} catch (error) {
				console.error("AuthContext: Error getting initial session:", error);
				if (mounted) {
					setUser(null);
				}
			} finally {
				if (mounted) {
					console.log("AuthContext: Setting loading to false");
					setLoading(false);
				}
			}
		};

		// Add a safety timeout to ensure loading doesn't hang forever
		timeout = setTimeout(() => {
			if (mounted) {
				console.log("AuthContext: Safety timeout reached, setting loading to false");
				setLoading(false);
			}
		}, 10000); // 10 second timeout

		getInitialSession().finally(() => {
			if (mounted) {
				clearTimeout(timeout);
			}
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log("AuthContext: Auth state change:", event, session ? "has session" : "no session");
			try {
				if (session?.user) {
					console.log("AuthContext: User logged in, fetching profile");
					await fetchUserProfile(session.user.id, session.user.email!);
				} else {
					console.log("AuthContext: User logged out");
					setUser(null);
				}
			} catch (error) {
				console.error("AuthContext: Error in auth state change:", error);
				setUser(null);
			} finally {
				setLoading(false);
			}
		});

		return () => {
			mounted = false;
			subscription?.unsubscribe();
			if (timeout) clearTimeout(timeout);
		};
	}, []);

	const fetchUserProfile = async (userId: string, email: string) => {
		console.log("AuthContext: Fetching profile for user:", userId);
		try {
			const { data, error } = await supabase.from("profiles").select("full_name").eq("id", userId).single();

			if (error && error.code !== "PGRST116") {
				// PGRST116 = no rows returned
				console.error("AuthContext: Profile fetch error:", error);
				throw error;
			}

			const userData = {
				id: userId,
				email,
				full_name: data?.full_name || null,
			};

			console.log("AuthContext: Setting user data:", userData);
			setUser(userData);
		} catch (error) {
			console.error("AuthContext: Error fetching user profile:", error);
			// Set user with email at minimum
			const fallbackUser = {
				id: userId,
				email,
				full_name: null,
			};
			console.log("AuthContext: Setting fallback user data:", fallbackUser);
			setUser(fallbackUser);
		}
	};

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				signOut: handleSignOut,
			}}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
