import type { StateCreator, StoreMutators } from 'zustand';
import { AppStoreState } from '..';

// API request interface
export interface ApiRequest {
	id: string;
	url: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	data?: any;
	headers?: Record<string, string>;
	timestamp: string;
	status: 'pending' | 'success' | 'error';
	response?: any;
	error?: string;
}

// Time-framed data interface
export interface TimeFramedData {
	id: string;
	type: string;
	data: any;
	timestamp: string;
	timeFrame: 'hour' | 'day' | 'week' | 'month' | 'year';
	startDate: string;
	endDate: string;
}

// API state interface
export interface ApiState {
	requests: ApiRequest[];
	timeFramedData: TimeFramedData[];
	isLoading: boolean;
	error: string | null;
	baseUrl: string;
	defaultHeaders: Record<string, string>;
	cache: Record<string, { data: any; timestamp: string; ttl: number }>;
}

// API actions interface
export interface ApiActions {
	request: <T = any>(
		url: string,
		method?: ApiRequest['method'],
		data?: any,
		options?: { headers?: Record<string, string>; cache?: boolean; ttl?: number }
	) => Promise<T>;
	get: <T = any>(url: string, options?: { cache?: boolean; ttl?: number }) => Promise<T>;
	post: <T = any>(
		url: string,
		data?: any,
		options?: { headers?: Record<string, string> }
	) => Promise<T>;
	put: <T = any>(
		url: string,
		data?: any,
		options?: { headers?: Record<string, string> }
	) => Promise<T>;
	delete: <T = any>(url: string, options?: { headers?: Record<string, string> }) => Promise<T>;
	setBaseUrl: (url: string) => void;
	setDefaultHeaders: (headers: Record<string, string>) => void;
	clearCache: () => void;
	getTimeFramedData: (
		type: string,
		timeFrame: TimeFramedData['timeFrame'],
		startDate: string,
		endDate: string
	) => Promise<TimeFramedData[]>;
	addTimeFramedData: (data: Omit<TimeFramedData, 'id' | 'timestamp'>) => void;
	clearRequests: () => void;
	getRequestHistory: () => ApiRequest[];
	getCachedData: (key: string) => any;
}

// Combined API slice type
export interface ApiSlice {
	api: ApiState & ApiActions;
}

// Initial API state
const initialApiState: ApiState = {
	requests: [],
	timeFramedData: [],
	isLoading: false,
	error: null,
	baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
	defaultHeaders: {
		'Content-Type': 'application/json',
	},
	cache: {},
};

// Create the API slice
const createApiSlice: StateCreator<
	AppStoreState,
	[],
	[['zustand/persist', unknown]],
	ApiSlice
	// [keyof StoreMutators<unknown, unknown>, unknown][]
> = (set, get) => ({
	api: {
		...initialApiState,

		setBaseUrl: (url) => {
			set((state) => ({
				api: {
					...state.api,
					baseUrl: url,
				},
			}));
		},

		setDefaultHeaders: (headers) => {
			set((state) => ({
				api: {
					...state.api,
					defaultHeaders: { ...state.api.defaultHeaders, ...headers },
				},
			}));
		},

		clearCache: () => {
			set((state) => ({
				api: {
					...state.api,
					cache: {},
				},
			}));
		},

		clearRequests: () => {
			set((state) => ({
				api: {
					...state.api,
					requests: [],
				},
			}));
		},

		getRequestHistory: () => {
			const { api } = get();
			return api.requests;
		},

		getCachedData: (key) => {
			const { api } = get();
			const cached = api.cache[key];

			if (!cached) return null;

			const now = Date.now();
			const cacheTime = new Date(cached.timestamp).getTime();

			if (now - cacheTime > cached.ttl) {
				// Cache expired, remove it
				set((state) => {
					const newCache = { ...state.api.cache };
					delete newCache[key];
					return {
						api: {
							...state.api,
							cache: newCache,
						},
					};
				});
				return null;
			}

			return cached.data;
		},

		request: async <T = any>(
			url: string,
			method: ApiRequest['method'] = 'GET',
			data?: any,
			options?: { headers?: Record<string, string>; cache?: boolean; ttl?: number }
		): Promise<T> => {
			const { api } = get();
			const fullUrl = url.startsWith('http') ? url : `${api.baseUrl}${url}`;
			const cacheKey = `${method}:${fullUrl}:${JSON.stringify(data)}`;

			// Check cache for GET requests
			if (method === 'GET' && options?.cache !== false) {
				const cached = get().api.getCachedData(cacheKey);
				if (cached) {
					return cached;
				}
			}

			const requestId = Date.now().toString();
			const request: ApiRequest = {
				id: requestId,
				url: fullUrl,
				method,
				data,
				headers: { ...api.defaultHeaders, ...options?.headers },
				timestamp: new Date().toISOString(),
				status: 'pending',
			};

			// Add request to history
			set((state) => ({
				api: {
					...state.api,
					requests: [...state.api.requests, request],
					isLoading: true,
					error: null,
				},
			}));

			try {
				// Simulate API call
				await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));

				// Mock response based on URL
				let response: any;
				if (url.includes('/auth/')) {
					response = { success: true, message: 'Auth operation completed' };
				} else if (url.includes('/data/')) {
					response = {
						data: Array.from({ length: 10 }, (_, i) => ({
							id: i + 1,
							value: Math.random() * 100,
							timestamp: new Date(Date.now() - i * 60000).toISOString(),
						})),
						total: 10,
					};
				} else {
					response = { success: true, data: 'Mock response' };
				}

				// Update request status
				set((state) => ({
					api: {
						...state.api,
						requests: state.api.requests.map((req) =>
							req.id === requestId
								? { ...req, status: 'success' as const, response }
								: req
						),
						isLoading: false,
					},
				}));

				// Cache GET requests
				if (method === 'GET' && options?.cache !== false) {
					const ttl = options?.ttl || 5 * 60 * 1000; // 5 minutes default
					set((state) => ({
						api: {
							...state.api,
							cache: {
								...state.api.cache,
								[cacheKey]: {
									data: response,
									timestamp: new Date().toISOString(),
									ttl,
								},
							},
						},
					}));
				}

				return response;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Request failed';

				set((state) => ({
					api: {
						...state.api,
						requests: state.api.requests.map((req) =>
							req.id === requestId
								? { ...req, status: 'error' as const, error: errorMessage }
								: req
						),
						isLoading: false,
						error: errorMessage,
					},
				}));

				throw error;
			}
		},

		get: async <T = any>(
			url: string,
			options?: { cache?: boolean; ttl?: number }
		): Promise<T> => {
			return get().api.request<T>(url, 'GET', undefined, options);
		},

		post: async <T = any>(
			url: string,
			data?: any,
			options?: { headers?: Record<string, string> }
		): Promise<T> => {
			return get().api.request<T>(url, 'POST', data, options);
		},

		put: async <T = any>(
			url: string,
			data?: any,
			options?: { headers?: Record<string, string> }
		): Promise<T> => {
			return get().api.request<T>(url, 'PUT', data, options);
		},

		delete: async <T = any>(
			url: string,
			options?: { headers?: Record<string, string> }
		): Promise<T> => {
			return get().api.request<T>(url, 'DELETE', undefined, options);
		},

		getTimeFramedData: async (type, timeFrame, startDate, endDate) => {
			const { api } = get();

			set((state) => ({
				api: {
					...state.api,
					isLoading: true,
				},
			}));

			try {
				// Mock time-framed data generation
				const data = Array.from({ length: 20 }, (_, i) => ({
					id: `${type}_${i}`,
					type,
					data: {
						value: Math.random() * 100,
						label: `Data point ${i + 1}`,
					},
					timestamp: new Date(Date.now() - i * 60000).toISOString(),
					timeFrame,
					startDate,
					endDate,
				}));

				set((state) => ({
					api: {
						...state.api,
						timeFramedData: [...state.api.timeFramedData, ...data],
						isLoading: false,
					},
				}));

				return data;
			} catch (error) {
				set((state) => ({
					api: {
						...state.api,
						isLoading: false,
						error:
							error instanceof Error
								? error.message
								: 'Failed to fetch time-framed data',
					},
				}));
				throw error;
			}
		},

		addTimeFramedData: (data) => {
			const timeFramedData: TimeFramedData = {
				...data,
				id: Date.now().toString(),
				timestamp: new Date().toISOString(),
			};

			set((state) => ({
				api: {
					...state.api,
					timeFramedData: [...state.api.timeFramedData, timeFramedData],
				},
			}));
		},
	},
});

export default createApiSlice;
