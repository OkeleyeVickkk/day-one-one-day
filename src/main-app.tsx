import { RouterProvider } from "react-router";
import { appRouter } from "./routes/app-routes";
import { Suspense } from "react";
import { AuthProvider } from "./contexts/auth-context";

function App() {
	return (
		<AuthProvider>
			<Suspense fallback={<div className="flex items-center justify-center h-screen">Loading....</div>}>
				<RouterProvider router={appRouter} />
			</Suspense>
		</AuthProvider>
	);
}

export default App;
