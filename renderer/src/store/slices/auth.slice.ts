import type { StateCreator, StoreMutators } from 'zustand';
import { AppStoreState } from '..';

// User interface
export interface User {
	id: string;
	email: string;
	name?: string;
	avatar?: string;
	role: 'user' | 'admin';
	createdAt: string;
	lastLogin?: string;
}

// Auth state interface
export interface AuthState {
	user: User | null;
	token: string | null;
	refreshToken: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
	loginAttempts: number;
	lastLoginAttempt?: string;
	sessionExpiry?: string;
}

// Auth actions interface
export interface AuthActions {
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string, name?: string) => Promise<void>;
	logout: () => void;
	refreshAuth: () => Promise<void>;
	updateUser: (userData: Partial<User>) => void;
	clearError: () => void;
	setLoading: (loading: boolean) => void;
	resetPassword: (email: string) => Promise<void>;
	verifyToken: () => Promise<boolean>;
}

// Combined auth slice type
export interface AuthSlice {
	auth: AuthState & AuthActions;
}

// Initial auth state
const initialAuthState: AuthState = {
	user: null,
	token: null,
	refreshToken: null,
	isAuthenticated: false,
	isLoading: false,
	error: null,
	loginAttempts: 0,
};

// Mock API functions (replace with your actual API)
const authAPI = {
	login: async (email: string, password: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));

		if (email === 'admin@example.com' && password === 'password') {
			return {
				user: {
					id: '1',
					email,
					name: 'Admin User',
					role: 'admin' as const,
					createdAt: new Date().toISOString(),
					lastLogin: new Date().toISOString(),
				},
				token: 'mock-jwt-token',
				refreshToken: 'mock-refresh-token',
			};
		}
		throw new Error('Invalid credentials');
	},

	register: async (email: string, password: string, name?: string) => {
		await new Promise((resolve) => setTimeout(resolve, 1000));
		return {
			user: {
				id: Date.now().toString(),
				email,
				name: name || 'New User',
				role: 'user' as const,
				createdAt: new Date().toISOString(),
			},
			token: 'mock-jwt-token',
			refreshToken: 'mock-refresh-token',
		};
	},

	refreshToken: async (refreshToken: string) => {
		await new Promise((resolve) => setTimeout(resolve, 500));
		return {
			token: 'new-mock-jwt-token',
			refreshToken: 'new-mock-refresh-token',
		};
	},

	resetPassword: async (email: string) => {
		await new Promise((resolve) => setTimeout(resolve, 1000));
		return { success: true };
	},

	verifyToken: async (token: string) => {
		await new Promise((resolve) => setTimeout(resolve, 300));
		return token === 'mock-jwt-token' || token === 'new-mock-jwt-token';
	},
};

// Create the auth slice
const createAuthSlice: StateCreator<
	AppStoreState,
	[],
	[['zustand/persist', unknown]],
	AuthSlice
	// [keyof StoreMutators<unknown, unknown>, unknown][]
> = (set, get) => ({
	auth: {
		...initialAuthState,

		setLoading: (loading) => {
			set((state) => ({
				auth: {
					...state.auth,
					isLoading: loading,
				},
			}));
		},

		clearError: () => {
			set((state) => ({
				auth: {
					...state.auth,
					error: null,
				},
			}));
		},

		login: async (email, password) => {
			const { auth } = get();

			set((state) => ({
				auth: {
					...state.auth,
					isLoading: true,
					error: null,
				},
			}));

			try {
				const response = await authAPI.login(email, password);
				const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

				set((state) => ({
					auth: {
						...state.auth,
						user: response.user,
						token: response.token,
						refreshToken: response.refreshToken,
						isAuthenticated: true,
						isLoading: false,
						error: null,
						loginAttempts: 0,
						lastLoginAttempt: new Date().toISOString(),
						sessionExpiry,
					},
				}));
			} catch (error) {
				set((state) => ({
					auth: {
						...state.auth,
						isLoading: false,
						error: error instanceof Error ? error.message : 'Login failed',
						loginAttempts: state.auth.loginAttempts + 1,
						lastLoginAttempt: new Date().toISOString(),
					},
				}));
				throw error;
			}
		},

		register: async (email, password, name) => {
			set((state) => ({
				auth: {
					...state.auth,
					isLoading: true,
					error: null,
				},
			}));

			try {
				const response = await authAPI.register(email, password, name);
				const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

				set((state) => ({
					auth: {
						...state.auth,
						user: response.user,
						token: response.token,
						refreshToken: response.refreshToken,
						isAuthenticated: true,
						isLoading: false,
						error: null,
						sessionExpiry,
					},
				}));
			} catch (error) {
				set((state) => ({
					auth: {
						...state.auth,
						isLoading: false,
						error: error instanceof Error ? error.message : 'Registration failed',
					},
				}));
				throw error;
			}
		},

		logout: () => {
			set((state) => ({
				auth: {
					...initialAuthState,
				},
			}));
		},

		refreshAuth: async () => {
			const { auth } = get();

			if (!auth.refreshToken) {
				throw new Error('No refresh token available');
			}

			try {
				const response = await authAPI.refreshToken(auth.refreshToken);
				const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

				set((state) => ({
					auth: {
						...state.auth,
						token: response.token,
						refreshToken: response.refreshToken,
						sessionExpiry,
					},
				}));
			} catch (error) {
				// If refresh fails, logout user
				get().auth.logout();
				throw error;
			}
		},

		updateUser: (userData) => {
			set((state) => ({
				auth: {
					...state.auth,
					user: state.auth.user ? { ...state.auth.user, ...userData } : null,
				},
			}));
		},

		resetPassword: async (email) => {
			set((state) => ({
				auth: {
					...state.auth,
					isLoading: true,
					error: null,
				},
			}));

			try {
				await authAPI.resetPassword(email);
				set((state) => ({
					auth: {
						...state.auth,
						isLoading: false,
					},
				}));
			} catch (error) {
				set((state) => ({
					auth: {
						...state.auth,
						isLoading: false,
						error: error instanceof Error ? error.message : 'Password reset failed',
					},
				}));
				throw error;
			}
		},

		verifyToken: async () => {
			const { auth } = get();

			if (!auth.token) {
				return false;
			}

			try {
				const isValid = await authAPI.verifyToken(auth.token);

				if (!isValid) {
					get().auth.logout();
					return false;
				}

				return true;
			} catch (error) {
				get().auth.logout();
				return false;
			}
		},
	},
});

export default createAuthSlice;
