import type { StateCreator } from 'zustand';
import { AppStoreState } from '..';

// Firebase auth user interface
export interface AuthUser {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL: string | null;
}

// WebView message interface
export interface WebViewMessage<T = any> {
	type: string;
	payload?: T;
}

// Firebase state interface
export interface FirebaseState {
	authUser: AuthUser | null;
	loading: boolean;
	isLoggedIn: boolean;
	error: string | null;
	isReactNativeWebView: boolean;
}

// Firebase actions interface
export interface FirebaseActions {
	setAuthUser: (user: AuthUser | null) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	setIsLoggedIn: (isLoggedIn: boolean) => void;
	sendToWebView: <T>(type: string, payload?: T) => void;
	handleWebViewMessage: (message: WebViewMessage) => void;
	notifyLoginSuccess: (user: AuthUser) => void;
	notifyLogout: () => void;
	requestSyncFromWebView: () => void;
	formatAuthUser: (user: any) => AuthUser;
	initializeAuth: () => void;
	startHeartbeat: () => void;
	stopHeartbeat: () => void;
}

// Combined firebase slice type
export interface FirebaseSlice {
	firebase: FirebaseState & FirebaseActions;
}

// Initial firebase state
const initialFirebaseState: FirebaseState = {
	authUser: null,
	loading: true,
	isLoggedIn: false,
	error: null,
	isReactNativeWebView: typeof window !== 'undefined' && !!(window as any).ReactNativeWebView,
};

// Create the firebase slice
const createFirebaseSlice: StateCreator<AppStoreState, [], [], FirebaseSlice> = (set, get) => {
	let heartbeatInterval: NodeJS.Timeout | null = null;

	return {
		firebase: {
			...initialFirebaseState,

			setAuthUser: (authUser) => {
				set((state) => ({
					firebase: {
						...state.firebase,
						authUser,
						isLoggedIn: !!authUser,
					},
				}));
			},

			setLoading: (loading) => {
				set((state) => ({
					firebase: {
						...state.firebase,
						loading,
					},
				}));
			},

			setError: (error) => {
				set((state) => ({
					firebase: {
						...state.firebase,
						error,
					},
				}));
			},

			setIsLoggedIn: (isLoggedIn) => {
				set((state) => ({
					firebase: {
						...state.firebase,
						isLoggedIn,
					},
				}));
			},

			sendToWebView: <T>(type: string, payload?: T) => {
				const { isReactNativeWebView } = get().firebase;
				if (isReactNativeWebView && (window as any).ReactNativeWebView) {
					(window as any).ReactNativeWebView.postMessage(
						JSON.stringify({ type, ...payload })
					);
				}
			},

			handleWebViewMessage: (message: WebViewMessage) => {
				const { sendToWebView, authUser } = get().firebase;

				try {
					switch (message.type) {
						case 'APP_READY':
							// RN app started → sync state
							sendToWebView('FIREBASE_AUTH_SYNC', {
								isLoggedIn: !!authUser,
								user: authUser,
							});
							break;

						case 'REQUEST_AUTH_SYNC':
							// RN explicitly requests a sync
							sendToWebView('FIREBASE_AUTH_SYNC', {
								isLoggedIn: !!authUser,
								user: authUser,
							});
							break;

						default:
							console.log('[WebView] Unknown message:', message);
					}
				} catch (e) {
					console.error('[WebView] Failed to handle message:', e);
					set((state) => ({
						firebase: {
							...state.firebase,
							error: 'Failed to handle WebView message',
						},
					}));
				}
			},

			formatAuthUser: (user: any): AuthUser => {
				return {
					uid: user.uid,
					email: user.email,
					displayName: user.displayName,
					photoURL: user.photoURL,
				};
			},

			notifyLoginSuccess: (user: AuthUser) => {
				const { sendToWebView } = get().firebase;
				sendToWebView('FIREBASE_LOGIN_SUCCESS', { user });
			},

			notifyLogout: () => {
				const { sendToWebView } = get().firebase;
				sendToWebView('FIREBASE_LOGOUT');
			},

			requestSyncFromWebView: () => {
				const { sendToWebView } = get().firebase;
				sendToWebView('REQUEST_AUTH_SYNC');
			},

			initializeAuth: () => {
				const { isReactNativeWebView, handleWebViewMessage } = get().firebase;

				if (!isReactNativeWebView) return;

				const handler = (event: MessageEvent) => {
					try {
						const data: WebViewMessage = JSON.parse(event.data);
						handleWebViewMessage(data);
					} catch (e) {
						console.error('[WebView] Failed to parse message:', e);
						set((state) => ({
							firebase: {
								...state.firebase,
								error: 'Failed to parse WebView message',
							},
						}));
					}
				};

				window.addEventListener('message', handler);

				// Cleanup function would need to be handled externally
				return () => window.removeEventListener('message', handler);
			},

			startHeartbeat: () => {
				const { isReactNativeWebView, sendToWebView, formatAuthUser } = get().firebase;

				if (!isReactNativeWebView) return;

				heartbeatInterval = setInterval(async () => {
					try {
						// This would need to be connected to actual Firebase auth
						// const currentUser = auth.currentUser;
						// if (!currentUser) return;

						const { authUser } = get().firebase;
						if (!authUser) return;

						// const token = await currentUser.getIdToken(true); // force refresh
						sendToWebView('FIREBASE_AUTH_HEARTBEAT', {
							isLoggedIn: true,
							user: authUser,
							// idToken: token,
							timestamp: Date.now(),
						});
					} catch (error) {
						console.error('[Firebase] Heartbeat error:', error);
						set((state) => ({
							firebase: {
								...state.firebase,
								error: 'Heartbeat failed',
							},
						}));
					}
				}, 30000);
			},

			stopHeartbeat: () => {
				if (heartbeatInterval) {
					clearInterval(heartbeatInterval);
					heartbeatInterval = null;
				}
			},
		},
	};
};

export default createFirebaseSlice;
