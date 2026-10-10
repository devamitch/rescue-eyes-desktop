import useAppStore from '@/store';
import type { AxiosHeaders, RawAxiosRequestHeaders } from 'axios';

export function getHeaders(): RawAxiosRequestHeaders | AxiosHeaders {
	try {
		const token = useAppStore?.getState()?.auth?.token;

		if (!token) {
			throw new Error('');
		}

		return {
			'x-auth-token': token,
			Authorization: `Bearer ${token}`,
		};
	} catch {
		return {
			Authorization: `Bearer `,
		};
	}
}
