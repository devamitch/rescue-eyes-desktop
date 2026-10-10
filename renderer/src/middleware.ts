import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if the pathname is exactly "/"
	if (pathname === '/') {
		const defaultLocale = routing.defaultLocale;
		const url = request.nextUrl.clone();
		url.pathname = `/${defaultLocale}`;
		return NextResponse.redirect(url);
	}

	// Check if the pathname starts with a valid locale
	const pathnameHasLocale = routing.locales.some(
		(locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
	);

	if (!pathnameHasLocale) {
		// Redirect to default locale if no locale is present
		const defaultLocale = routing.defaultLocale;
		const url = request.nextUrl.clone();
		url.pathname = `/${defaultLocale}${pathname}`;
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/', '/(ko|ja|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
