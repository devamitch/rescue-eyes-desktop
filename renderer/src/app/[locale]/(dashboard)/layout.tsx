'use client';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/provider/AuthUserContext';
import { EyeTrackingProvider } from '@/provider/EyeTrackingProvider';
import { withLazyLoad } from '@/provider/LazyLoad';
import { PiPProvider } from '@/provider/PiPContext';
import useAppStore from '@/store';
import { useEffect, useState } from 'react';
import styles from './layout.module.scss';

// Lazy load only heavy components that are not immediately visible
const BottomTabBar = withLazyLoad(() => import('@/components/layout/BottomTabBar/BottomTabBar'), {
	threshold: 0.5, // Load when 50% visible
});
const Sidebar = withLazyLoad(() => import('@/components/layout/Sidebar/Sidebar'), {
	threshold: 0.5, // Load when 50% visible
});
const LazyFooter = withLazyLoad(() => import('@/components/layout/Footer/Footer'), {
	threshold: 0.5, // Load when 50% visible
});
const Navbar = withLazyLoad(() => import('@/components/layout/Navbar/Navbar'), {
	threshold: 0.5, // Load when 50% visible
});

const LazyPictureInMode = withLazyLoad(
	() => import('@/components/layout/PictureInMode/PictureInMode'),
	{
		threshold: 0.1, // Load earlier since it might be important
	}
);

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const state = useAppStore();
	console.log('App Store State:', { state });

	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkIfMobile = () => {
			const isMobile = window.innerWidth <= 600;
			setIsMobile(isMobile);
			if (!isMobile) {
				setIsSidebarOpen(false);
			}
		};
		checkIfMobile();
		window.addEventListener('resize', checkIfMobile);
		return () => window.removeEventListener('resize', checkIfMobile);
	}, []);

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	const closeSidebar = () => {
		setIsSidebarOpen(false);
	};

	const setLoading = useAppStore?.((state) => state?.camera?.setLoading);
	// const setLoading1 = useBoundStore?.((state) => state?.camera?.setLoading);
	// const setLoading2 = useBearStore?.((state) => state?.camera?.setLoading);

	// console.log('Camera setLoading function:', { setLoading, setLoading1, setLoading2 });

	// Safe destructuring with defaults
	const {
		startScreenTime = () => console.warn('startScreenTime not available'),
		checkAndResetScreenTime = () => console.warn('checkAndResetScreenTime not available'),
	} = useAppStore((state) => state?.screenTime) || {};

	const { authUser, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		startScreenTime();
		checkAndResetScreenTime();

		return () => {
			if ((window as any).screenTimeInterval) {
				clearInterval((window as any).screenTimeInterval);
			}
		};
	}, [startScreenTime, checkAndResetScreenTime]);

	useEffect(() => {
		if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
			navigator.serviceWorker
				.register('/sw.js', { scope: '/' })
				.then((registration) => {
					console.log('SW registered: ', registration);
				})
				.catch((registrationError) => {
					console.log('SW registration failed: ', registrationError);
				});
		}

		const handleOnline = () => console.log('App is online');
		const handleOffline = () => console.log('App is offline');

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	useEffect(() => {
		if (!authUser) router.push('/signin');
	}, [authUser, router]);

	return (
		<EyeTrackingProvider>
			<PiPProvider>
				<div className={styles.container}>
					<Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

					<div className={styles.content}>
						<Navbar onSidebarToggle={toggleSidebar} />
						<main className={styles.main}>
							{children}
							{/* Only lazy load Footer since it's at the bottom */}
							<LazyFooter />
						</main>
					</div>
					<BottomTabBar />
					{/* Lazy load PictureInMode since it might not be used immediately */}
					<LazyPictureInMode />
				</div>
			</PiPProvider>
		</EyeTrackingProvider>
	);
}
