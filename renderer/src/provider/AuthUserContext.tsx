'use client';
import { UseFirebaseAuthProp } from '@/types/auth';
import { createContext, useContext, useLayoutEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

const authUserContext = createContext<UseFirebaseAuthProp>({
	authUser: null,
	loading: true,
});

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
	const auth = useFirebaseAuth();
	const [loading, setLoading] = useState(true);
	useLayoutEffect(() => {
		if (!auth.loading) {
			setLoading(false);
		}
	}, [auth.loading]);
	if (loading) {
		return null; // or a loading spinner, etc.
	}
	return (
		<authUserContext.Provider value={auth}>
			{children}
			<Toaster />
		</authUserContext.Provider>
	);
}

export const useAuth = () => useContext(authUserContext);
