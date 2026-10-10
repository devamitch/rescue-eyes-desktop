import { routing } from '@/i18n/routing';
import { AuthUserProvider } from '@/provider/AuthUserContext';
import { Providers } from '@/provider/providers';
import { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

interface LocaleLayoutProps {
	children: ReactNode;
	params: Promise<{ locale: string }>; // Add Promise here
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: 'metadata' });

	return {
		applicationName: t('appName'),
		title: {
			default: t('title'),
			template: t('titleTemplate'),
		},
		description: t('description'),
		manifest: '/manifest.json',
		appleWebApp: {
			capable: true,
			statusBarStyle: 'default',
			title: t('title'),
		},
		formatDetection: {
			telephone: false,
		},
		openGraph: {
			type: 'website',
			siteName: t('appName'),
			title: t('title'),
			description: t('description'),
			locale: locale,
		},
		twitter: {
			card: 'summary',
			title: t('title'),
			description: t('description'),
		},
		alternates: {
			languages: {
				en: '/en',
				ja: '/ja',
				ko: '/ko',
			},
		},
	};
}

export const viewport: Viewport = {
	themeColor: '#485953ff',
};

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

// CORRECTED: Add async and properly await params
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
	// CORRECTED: Properly await the params promise
	const { locale } = await params;

	// Validate that the incoming `locale` parameter is valid
	if (!routing.locales.includes(locale as any)) {
		notFound();
	}

	// Providing all messages to the client side
	const messages = await getMessages({ locale });

	return (
		<Providers>
			<html lang={locale} suppressHydrationWarning>
				<head>
					<link rel="stylesheet" href="/css/global.css" />
					<meta name="theme-color" content="#ffffff" />
					<meta name="application-name" content="RescueEyes" />
					<meta name="apple-mobile-web-app-capable" content="yes" />
					<meta name="apple-mobile-web-app-status-bar-style" content="default" />
					<script src="/mediapipe/wasm/vision_wasm_internal.js"></script>
					<meta name="mobile-web-app-capable" content="yes" />
					<meta name="apple-mobile-web-app-capable" content="yes" />
				</head>
				<body className={inter.className}>
					<NextIntlClientProvider messages={messages} locale={locale}>
						<AuthUserProvider>{children}</AuthUserProvider>
					</NextIntlClientProvider>
					<script src="/mediapipe/wasm/vision_wasm_internal.js"></script>
				</body>
			</html>
		</Providers>
	);
}
