import { ConvexReactClient } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
	console.error("missing envar VITE_CONVEX_URL");
}

// Create the Convex client
export const convexClient = new ConvexReactClient(CONVEX_URL, {
	unsavedChangesWarning: false,
});

// Create the Convex Query client
export const convexQueryClient = new ConvexQueryClient(convexClient);

// Create the QueryClient with Convex integration
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryKeyHashFn: convexQueryClient.hashFn(),
			queryFn: convexQueryClient.queryFn(),
		},
	},
});

// Connect ConvexQueryClient to QueryClient
convexQueryClient.connect(queryClient);
