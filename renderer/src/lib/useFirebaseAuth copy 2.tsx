'use client';
import { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../constants/firebase';

import { FormattedUser } from '@/types/auth';
import { onAuthStateChanged as _onAuthStateChanged } from 'firebase/auth';

const formatAuthUser = (user: User): FormattedUser => ({
	uid: user.uid,
	email: user.email,
	displayName: user.displayName,
	photoURL: user.photoURL || undefined,
});

// Simple environment detection - ADDED THIS
const detectEnvironment = (): string => {
	if (typeof window === 'undefined') return 'server';

	const userAgent = navigator.userAgent.toLowerCase();

	// React Native WebView detection
	if ((window as any).ReactNativeWebView) {
		return 'react-native-webview';
	}

	// In-app browser detection
	const isInAppBrowser =
		/(instagram|facebook|twitter|fbav|fb_iab|line|whatsapp|telegram|messenger|wkwebview|inapp)/i.test(
			userAgent
		);
	if (isInAppBrowser) return 'inapp-browser';

	// Mobile browser detection
	const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
		userAgent
	);
	if (isMobile) return 'mobile-browser';

	// Desktop browser
	return 'desktop-browser';
};

export default function useFirebaseAuth() {
	const [authUser, setAuthUser] = useState<FormattedUser | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [environment, setEnvironment] = useState<string>('unknown'); // ADDED THIS

	const authStateChanged = async (authState: User | null): Promise<void> => {
		if (!authState) {
			setAuthUser(null);
			setLoading(false);
			return;
		}
		setLoading(true);
		const formattedUser = formatAuthUser(authState);
		setAuthUser(formattedUser);
		setLoading(false);
	};

	const onAuthStateChanged = (cb: (user: User | null) => void) => {
		return _onAuthStateChanged(auth, cb);
	};

	useEffect(() => {
		// Detect environment - ADDED THIS
		const detectedEnv = detectEnvironment();
		setEnvironment(detectedEnv);
		console.log('Running in environment:', detectedEnv);

		const unsubscribe = onAuthStateChanged(authStateChanged);
		return () => unsubscribe();
	}, []);

	// Simple environment flags - ADDED THIS
	const isReactNativeWebView = environment === 'react-native-webview';
	const isInAppBrowser = environment === 'inapp-browser';
	const isMobileBrowser = environment === 'mobile-browser';
	const isDesktopBrowser = environment === 'desktop-browser';

	return {
		authUser,
		loading,
		environment, // ADDED THIS
		isReactNativeWebView, // ADDED THIS
		isInAppBrowser, // ADDED THIS
		isMobileBrowser, // ADDED THIS
		isDesktopBrowser, // ADDED THIS
	};
}
