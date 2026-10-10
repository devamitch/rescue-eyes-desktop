'use client';
import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe, Check, Languages } from 'lucide-react';
import DropdownMenu from '@/components/utils/Dropdown';
import styles from './LanguageSwitcher.module.css';

const languages = [
	{
		code: 'en',
		name: 'English',
		nativeName: 'English',
		flag: '🇺🇸',
	},
	{
		code: 'ja',
		name: 'Japanese',
		nativeName: '日本語',
		flag: '🇯🇵',
	},
	{
		code: 'ko',
		name: 'Korean',
		nativeName: '한국어',
		flag: '🇰🇷',
	},
];

export default function LanguageSwitcher() {
	const locale = useLocale();
	const t = useTranslations();
	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();

	const handleLanguageChange = (languageCode: string) => {
		if (languageCode === locale) {
			return;
		}

		startTransition(() => {
			const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
			
			const newPath = languageCode === 'en' 
				? pathWithoutLocale === '/' ? '/' : pathWithoutLocale
				: `/${languageCode}${pathWithoutLocale}`;
			
			router.push(newPath);
		});
	};

	const dropdownItems = languages.map((language) => ({
		label: (
			<div className={styles.languageItem}>
				<span className={styles.flag}>{language.flag}</span>
				<div className={styles.languageText}>
					<span className={styles.nativeName}>{language.nativeName}</span>
					</div>
				{language.code === locale && (
					<Check className={styles.checkIcon} size={16} />
				)}
			</div>
		),
		onSelect: () => handleLanguageChange(language.code),
	}));

	return (
		<DropdownMenu
			trigger={
				<button 
					className={styles.iconButton}
					disabled={isPending}
					aria-label={t('common.changeLanguage')}
				>
					<Languages className={styles.icon} />
				</button>
			}
			header={
				<div className={styles.dropdownHeader}>
					{t('common.changeLanguage')}
				</div>
			}
			items={dropdownItems}
			align="center"
		/>
	);
}