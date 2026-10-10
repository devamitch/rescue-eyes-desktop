// import { hasLocale } from 'next-intl';
// import { getRequestConfig } from 'next-intl/server';
// import { cookies } from 'next/headers';
// import { routing } from './routing';

// const locales = ['en', 'ja', 'ko'];

// export default getRequestConfig(async ({ locale: requestLocale }) => {
// 	const store = await cookies();
// 	const requested = await requestLocale;
// 	const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
// 	const locale2 = locale ?? store.get('locale')?.value ?? 'en';

// 	console.log({ locale2, requested, locale });
// 	return {
// 		messages: (await import(`./${locale2}.json`)).default,
// 		locale: locale2,
// 	};
// });

import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale = 'en' }) => {
	// Validate that the incoming `locale` parameter is valid
	if (!routing.locales.includes(locale as any)) {
		console.error(`Invalid locale: ${locale}`);
		// Fall back to default locale instead of throwing
		locale = routing.defaultLocale;
	}

	console.log('Loading messages for locale:', locale);

	return {
		messages: (await import(`./${locale}.json`)).default,
		locale,
	};
});
