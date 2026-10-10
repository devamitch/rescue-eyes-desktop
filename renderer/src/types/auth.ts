export interface FormattedUser {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL?: string;
}

export interface UseFirebaseAuthProp {
	authUser: FormattedUser | null;
	loading: boolean;
}

export type AuthError = any;
