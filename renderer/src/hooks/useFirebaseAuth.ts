import { auth } from '@/constants/firebase';
import { User } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';

interface AuthUser {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL: string | null;
}

interface WebViewMessage<T = any> {
	type: string;
	payload?: T;
}

// Detect if we’re running inside RN WebView
const isReactNativeWebView = typeof window !== 'undefined' && !!(window as any).ReactNativeWebView;

function formatAuthUser(user: User): AuthUser {
	return {
		uid: user.uid,
		email: user.email,
		displayName: user.displayName,
		photoURL: user.photoURL,
	};
}

export function useFirebaseAuth() {
	const [authUser, setAuthUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	// Send a message to RN WebView
	const sendToWebView = useCallback(<T,>(type: string, payload?: T) => {
		if (isReactNativeWebView) {
			(window as any).ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
		}
	}, []);

	// Firebase listener
	const authStateChanged = useCallback(
		async (user: User | null) => {
			setLoading(false);

			if (!user) {
				setAuthUser(null);
				sendToWebView('FIREBASE_AUTH_STATE', { isLoggedIn: false, user: null });
				return;
			}

			const token = await user.getIdToken(); // not forced refresh
			const formattedUser = formatAuthUser(user);

			setAuthUser(formattedUser);
			sendToWebView('FIREBASE_AUTH_STATE', {
				isLoggedIn: true,
				user: formattedUser,
				idToken: token,
			});
		},
		[sendToWebView]
	);

	// WebView → Next.js messages
	useEffect(() => {
		if (!isReactNativeWebView) return;

		const handler = (event: MessageEvent) => {
			try {
				const data: WebViewMessage = JSON.parse(event.data);
				switch (data.type) {
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
						console.log('[WebView] Unknown message:', data);
				}
			} catch (e) {
				console.error('[WebView] Failed to parse message:', e);
			}
		};

		window.addEventListener('message', handler);
		return () => window.removeEventListener('message', handler);
	}, [authUser, sendToWebView]);

	// Listen for Firebase auth changes
	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(authStateChanged);
		return () => unsubscribe();
	}, [authStateChanged]);

	// Heartbeat → keep RN updated every 30s
	useEffect(() => {
		if (!isReactNativeWebView) return;

		const interval = setInterval(async () => {
			if (!auth.currentUser) return;
			const token = await auth.currentUser.getIdToken(true); // force refresh
			sendToWebView('FIREBASE_AUTH_HEARTBEAT', {
				isLoggedIn: true,
				user: formatAuthUser(auth.currentUser),
				idToken: token,
				timestamp: Date.now(),
			});
		}, 30000);

		return () => clearInterval(interval);
	}, [sendToWebView]);

	return {
		authUser,
		loading,
		// Methods RN can call from Next.js
		webViewMethods: {
			notifyLoginSuccess: (user: User) =>
				sendToWebView('FIREBASE_LOGIN_SUCCESS', {
					user: formatAuthUser(user),
				}),
			notifyLogout: () => sendToWebView('FIREBASE_LOGOUT'),
			requestSyncFromWebView: () => sendToWebView('REQUEST_AUTH_SYNC'),
		},
	};
}
