import { TOKELESS_URLS, TOKELESS_URLS_TYPE, URLS, URLS_TYPE } from '@/constants/urls';

export const isRegisteredURL = (url?: string): url is URLS_TYPE => {
	return Object.values(URLS).includes(url as URLS_TYPE);
};

export const isAuthURL = (url: URLS_TYPE): url is TOKELESS_URLS_TYPE => {
	return Object.values(TOKELESS_URLS).includes(url as TOKELESS_URLS_TYPE);
};
