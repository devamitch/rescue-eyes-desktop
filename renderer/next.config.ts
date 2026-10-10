import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import NextPWA from 'next-pwa';

const withNextIntl = createNextIntlPlugin();

const withPWA = NextPWA({
	dest: 'public',
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === 'development',
	// runtimeCaching: [
	// 	{
	// 		urlPattern: /\/api\/.*$/i,
	// 		handler: 'NetworkFirst',
	// 		options: {
	// 			cacheName: 'api-cache',
	// 			expiration: {
	// 				maxEntries: 10,
	// 				maxAgeSeconds: 1 * 60 * 60, // 1 hour
	// 			},
	// 			networkTimeoutSeconds: 10,
	// 		},
	// 	},
	// 	{
	// 		urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
	// 		handler: 'StaleWhileRevalidate',
	// 		options: {
	// 			cacheName: 'static-font-assets',
	// 			expiration: {
	// 				maxEntries: 4,
	// 				maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
	// 			},
	// 		},
	// 	},
	// 	{
	// 		urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
	// 		handler: 'StaleWhileRevalidate',
	// 		options: {
	// 			cacheName: 'static-image-assets',
	// 			expiration: {
	// 				maxEntries: 64,
	// 				maxAgeSeconds: 24 * 60 * 60, // 24 hour
	// 			},
	// 		},
	// 	},
	// 	{
	// 		urlPattern: /\.(?:js|wasm)$/i,
	// 		handler: 'StaleWhileRevalidate',
	// 		options: {
	// 			cacheName: 'static-js-assets',
	// 			expiration: {
	// 				maxEntries: 32,
	// 				maxAgeSeconds: 24 * 60 * 60, // 24 hours
	// 			},
	// 		},
	// 	},
	// 	{
	// 		urlPattern: /\.(?:css|less)$/i,
	// 		handler: 'StaleWhileRevalidate',
	// 		options: {
	// 			cacheName: 'static-style-assets',
	// 			expiration: {
	// 				maxEntries: 32,
	// 				maxAgeSeconds: 24 * 60 * 60, // 24 hours
	// 			},
	// 		},
	// 	},
	// 	{
	// 		urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
	// 		handler: 'StaleWhileRevalidate',
	// 		options: {
	// 			cacheName: 'next-data',
	// 			expiration: {
	// 				maxEntries: 32,
	// 				maxAgeSeconds: 24 * 60 * 60, // 24 hours
	// 			},
	// 		},
	// 	},
	// 	{
	// 		urlPattern: /\.(?:json|xml|csv)$/i,
	// 		handler: 'NetworkFirst',
	// 		options: {
	// 			cacheName: 'static-data-assets',
	// 			expiration: {
	// 				maxEntries: 32,
	// 				maxAgeSeconds: 24 * 60 * 60, // 24 hours
	// 			},
	// 		},
	// 	},
	// 	{
	// 		urlPattern: ({ url }) => {
	// 			const isSameOrigin = self.origin === url.origin;
	// 			return !isSameOrigin;
	// 		},
	// 		handler: 'NetworkFirst',
	// 		options: {
	// 			cacheName: 'cross-origin',
	// 			expiration: {
	// 				maxEntries: 32,
	// 				maxAgeSeconds: 60 * 60, // 1 hour
	// 			},
	// 			networkTimeoutSeconds: 10,
	// 		},
	// 	},
	// 	// Special caching for WASM files and models
	// 	{
	// 		urlPattern: /\/wasm\/.*/i,
	// 		handler: 'CacheFirst',
	// 		options: {
	// 			cacheName: 'wasm-files',
	// 			expiration: {
	// 				maxEntries: 10,
	// 				maxAgeSeconds: 1 * 60 * 60, // 1 hour
	// 			},
	// 		},
	// 	},
	// 	{
	// 		urlPattern: /\/models\/.*/i,
	// 		handler: 'CacheFirst',
	// 		options: {
	// 			cacheName: 'eye-scan-model',
	// 			expiration: {
	// 				maxEntries: 10,
	// 				maxAgeSeconds: 1 * 60 * 60, // 1 hour
	// 			},
	// 		},
	// 	},
	// 	// Cache pages for offline navigation
	// 	{
	// 		urlPattern: ({ request }) => request.mode === 'navigate',
	// 		handler: 'NetworkFirst',
	// 		options: {
	// 			cacheName: 'pages',
	// 			expiration: {
	// 				maxEntries: 50,
	// 				maxAgeSeconds: 24 * 60 * 60, // 24 hours
	// 			},
	// 			networkTimeoutSeconds: 10,
	// 		},
	// 	},
	// ],

	additionalManifestEntries: [
		{ url: '/wasm/vision_wasm_internal.js', revision: null },
		{ url: '/wasm/vision_wasm_internal.wasm', revision: null },
		{ url: '/wasm/vision_wasm_nosimd_internal.js', revision: null },
		{ url: '/wasm/vision_wasm_nosimd_internal.wasm', revision: null },
		{ url: '/models/face_landmarker.task', revision: null },
	],
});

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
	reactStrictMode: isDev,
	eslint: {
		// Prevent ESLint errors from failing the build
		ignoreDuringBuilds: true,
	},
	typescript: {
		// Prevent TS errors from failing the build
		ignoreBuildErrors: true,
	},
	images: {
		unoptimized: isDev,
	},
	// Enable static exports for full offline support
	// output: 'export',
	trailingSlash: true,
	// Disable image optimization for offline export
	images: {
		unoptimized: true,
	},
	// Configure headers for offline support
	// async headers() {
	// 	return [
	// 		{
	// 			source: '/manifest.json',
	// 			headers: [
	// 				{
	// 					key: 'Content-Type',
	// 					value: 'application/manifest+json',
	// 				},
	// 				{
	// 					key: 'Cache-Control',
	// 					value: 'public, max-age=86400, immutable',
	// 				},
	// 			],
	// 		},
	// 		{
	// 			source: '/sw.js',
	// 			headers: [
	// 				{
	// 					key: 'Content-Type',
	// 					value: 'application/javascript',
	// 				},
	// 				{
	// 					key: 'Cache-Control',
	// 					value: 'public, max-age=0, must-revalidate',
	// 				},
	// 				{
	// 					key: 'Service-Worker-Allowed',
	// 					value: '/',
	// 				},
	// 			],
	// 		},
	// 		{
	// 			source: '/wasm/:path*',
	// 			headers: [
	// 				{
	// 					key: 'Cache-Control',
	// 					value: 'public, max-age=3600, immutable',
	// 				},
	// 			],
	// 		},
	// 		{
	// 			source: '/mediapipe/:path*',
	// 			headers: [
	// 				{
	// 					key: 'Cache-Control',
	// 					value: 'public, max-age=3600, immutable',
	// 				},
	// 			],
	// 		},
	// 		{
	// 			source: '/:path*',
	// 			headers: [
	// 				{
	// 					key: 'Cache-Control',
	// 					value: 'public, max-age=86400, must-revalidate',
	// 				},
	// 			],
	// 		},
	// 		{
	// 			source: '/(.*)',
	// 			headers: [
	// 				{
	// 					key: 'X-Content-Type-Options',
	// 					value: 'nosniff',
	// 				},
	// 				{
	// 					key: 'X-Frame-Options',
	// 					value: 'DENY',
	// 				},
	// 				{
	// 					key: 'Referrer-Policy',
	// 					value: 'strict-origin-when-cross-origin',
	// 				},
	// 			],
	// 		},
	// 		{
	// 			source: '/sw.js',
	// 			headers: [
	// 				{
	// 					key: 'Content-Type',
	// 					value: 'application/javascript; charset=utf-8',
	// 				},
	// 				{
	// 					key: 'Cache-Control',
	// 					value: 'no-cache, no-store, must-revalidate',
	// 				},
	// 				{
	// 					key: 'Content-Security-Policy',
	// 					value: "default-src 'self'; script-src 'self'",
	// 				},
	// 			],
	// 		},
	// 	];
	// },
	// Ensure all routes are included in the export
	// exportPathMap: async function (defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
	// 	return {
	// 		'/': { page: '/' },
	// 		'/dashboard': { page: '/dashboard' },
	// 		'/eye-tracking': { page: '/eye-tracking' },
	// 		'/history': { page: '/history' },
	// 		'/profile': { page: '/profile' },
	// 		'/icare': { page: '/icare' },
	// 		'/settings': { page: '/settings' },
	// 		'/register': { page: '/register' },
	// 		'/signin': { page: '/signin' },
	// 		'/offline': { page: '/offline' },
	// 		'/404': { page: '/404' },
	// 		// Add all your app routes here
	// 	};
	// },
	// Enable compression for better performance
	compress: true,
	// Configure webpack for better offline support
	webpack: (config, { isServer }) => {
		if (!isServer) {
			// Ensure WASM files are properly handled
			config.resolve.extensions.push('.wasm');
			config.experiments = {
				asyncWebAssembly: true,
				layers: true,
			};
		}
		return config;
	},
};

export default withNextIntl(withPWA(nextConfig));
