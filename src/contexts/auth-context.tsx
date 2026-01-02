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
		// Get initial session
		const getInitialSession = async () => {
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (session?.user) {
					setUser({
						id: session.user.id,
						email: session.user.email!,
						full_name: session.user.user_metadata?.full_name || null,
					});
				}
			} catch (error) {
				// If session is invalid, clear it and start fresh
				console.error("Error fetching session:", error);
				await supabase.auth.signOut();
				setUser(null);
			}
			setLoading(false);
		};

		getInitialSession();

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_, session) => {
			if (session?.user) {
				setUser({
					id: session.user.id,
					email: session.user.email!,
					full_name: session.user.user_metadata?.full_name || null,
				});
			} else {
				setUser(null);
			}
			setLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	const signOut = async () => {
		await supabase.auth.signOut();
		setUser(null);
	};

	return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
