'use client';
import DropdownMenu from '@/components/utils/Dropdown';
import { auth } from '@/constants/firebase';
import useTranslationData from '@/hooks/use-translation-data';
import { useAuth } from '@/provider/AuthUserContext';
import { signOut } from 'firebase/auth';
import {
	Bell,
	ChevronDown,
	ChevronLeft,
	LogOut,
	Menu,
	MessageSquare,
	Search,
	Settings as SettingsIcon,
	User as UserIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import styles from './Navbar.module.css';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';

export default function Navbar({ onSidebarToggle }: { onSidebarToggle?: () => void }) {
	const { authUser } = useAuth();
	const pathname = usePathname();
	const router = useRouter();
	const { navbarText } = useTranslationData();
	const [isMobile, setIsMobile] = useState(false);
	const { sidebarText } = useTranslationData();

	const t = useTranslations();

	// Mobile detection
	useEffect(() => {
		const checkIfMobile = () => {
			setIsMobile(window.innerWidth <= 600);
		};
		checkIfMobile();
		window.addEventListener('resize', checkIfMobile);
		return () => window.removeEventListener('resize', checkIfMobile);
	}, []);

	const handleLogout = async () => {
		try {
			await signOut(auth);
			router.push('/signin');
		} catch (e) {
			console.error('Logout failed', e);
		}
	};

	const handleUserButtonClick = () => {
		router.push('/profile');
	};

	const pagePath = useMemo(() => {
		const path = pathname.split('/')[2];
		const translatedPath = t.raw(`pathnames./${path}`) as string;
		return translatedPath?.replace('/', '');
	}, [pathname, t]);

	const handleBackClick = () => {
		router.back();
	};

	return (
		<nav className={styles.navbar}>
			{isMobile && ((pagePath === 'settings' || pagePath === 'profile') && (
				<ChevronLeft
					size={36}
					color="var(--metricValue)"
					className={styles.backButton}
					onClick={handleBackClick}
				/>
			))}
			
			<div className={styles.header} style={{ textTransform: 'capitalize' }}>
				{isMobile && pagePath !== 'settings' && pagePath !== 'profile' && (
				<button 
					className={styles.menuButton}
					onClick={onSidebarToggle}
				>
					<Menu size={24} color="var(--metricValue)" />
				</button>
			)}
		
				{isMobile && pagePath=== 'dashboard' ? <span className={styles.logo}>{sidebarText.logoText}</span> : pagePath}
			</div>
			<div className={styles.navItems}>	
				{/* <button className={styles.iconButton}>
					<Bell size={20} color="var(--metricValue)" fill="var(--metricValue)" />
				</button>		 */}
				{/* <button className={styles.searchButton}>
					<Search size={20} color="var(--metricValue)" />
					<input
						type="text"
						placeholder={navbarText.searchPlaceholder}
						className={styles.searchInput}
					/>
				</button>
				<button className={styles.iconButton}>
					<MessageSquare size={20} color="var(--metricValue)" fill="var(--metricValue)" />
				</button> */}
				{isMobile ? (
					pagePath === 'profile' ? (
						<SettingsIcon
							size={36}
							color="var(--metricValue)"
							onClick={() => router.push('/settings')}
							className={styles.backButton}
						/>
					) : (
						<button className={styles.userSection} onClick={handleUserButtonClick}>
							<Image
								src="/mockData/profile.png"
								alt="Profile"
								width={36}
								height={36}
								className={styles.avatar}
							/>
						</button>
					)
				) : (
                   <>
				   <LanguageSwitcher />
				   <DropdownMenu
						trigger={
							<button className={styles.userSection}>
								<Image
									src="/mockData/profile.png"
									alt="Profile"
									width={36}
									height={36}
									className={styles.avatar}
								/>
								<span>
									<p className={styles.userName}>{authUser?.displayName}</p>
									<p className={styles.userEmail}>{authUser?.email}</p>
								</span>
								<ChevronDown size={18} color="var(--metricValue)" />
							</button>
						}
						items={[
							{
								label: navbarText.userMenuItems.profile,
								icon: <UserIcon size={16} />,
								href: '/profile',
							},
							{
								label: navbarText.userMenuItems.settings,
								icon: <SettingsIcon size={16} />,
								href: '/settings',
							},
							{
								label: navbarText.userMenuItems.logout,
								icon: <LogOut size={16} />,
								onSelect: handleLogout,
								danger: true,
							},
						]}
						align="center"
					/></>
					
				)}
			</div>
		</nav>
	);
}
