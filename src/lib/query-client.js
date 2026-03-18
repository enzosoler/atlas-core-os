import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
		},
		mutations: {
			onError: (err) => {
				console.error('[Mutation failed]', err);
			},
		},
	},
});

// Expose globally for auth logout cleanup
if (typeof window !== 'undefined') {
	window.__queryClient = queryClientInstance;
}