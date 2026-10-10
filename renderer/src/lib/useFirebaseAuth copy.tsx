'use client';
import { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../constants/firebase';

import { FormattedUser, UseFirebaseAuthProp } from '@/types/auth';
import { onAuthStateChanged as _onAuthStateChanged } from 'firebase/auth';

const formatAuthUser = (user: User): FormattedUser => ({
	uid: user.uid,
	email: user.email,
	displayName: user.displayName,
	photoURL: user.photoURL || undefined,
});

export default function useFirebaseAuth(): UseFirebaseAuthProp {
	const [authUser, setAuthUser] = useState<FormattedUser | null>(null);
	const [loading, setLoading] = useState<boolean>(true);

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
		const unsubscribe = onAuthStateChanged(authStateChanged);
		return () => unsubscribe();
	}, []);

	return {
		authUser,
		loading,
	};
}
