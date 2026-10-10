'use client';

import useTranslationData from '@/hooks/use-translation-data';
import { Link } from '@/i18n/navigation';
import { Activity, Eye, Home } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import styles from './BottomTabBar.module.css';

export function BottomTabBar() {
	const pathname = usePathname();
	const { sidebarText } = useTranslationData();
	const locale = useLocale();

	const tabItems = [
		{
			title: sidebarText.navItems[0].title,
			url: sidebarText.navItems[0].url,
			icon: Home,
		},
		{
			title: sidebarText.navItems[1].title,
			url: sidebarText.navItems[1].url,
			icon: Activity,
		},
		{
			title: sidebarText.navItems[2].title,
			url: sidebarText.navItems[2].url,
			icon: Eye,
		},
	];

	return (
		<div className={styles.bottomTabBar}>
			{tabItems.map((item) => {
				const isActive = pathname.includes(item.url);
				const IconComponent = item.icon;

				return (
					<Link
						key={item.title}
						className={`${styles.tabItem} ${isActive ? styles.active : styles.inactive}`}
						href={item.url}
						locale={locale}
					>
						<div className={styles.tabContent}>
							<IconComponent size={20} />
							{isActive && <span className={styles.tabLabel}>{item.title}</span>}
						</div>
					</Link>
				);
			})}
		</div>
	);
}

export default BottomTabBar;
