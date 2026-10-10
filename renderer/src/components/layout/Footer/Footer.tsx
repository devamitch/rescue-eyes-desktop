'use client';

import useTranslationData from '@/hooks/use-translation-data';
import { Link } from '@/i18n/navigation';
import styles from './Footer.module.css';

export default function Footer() {
	const { footerText } = useTranslationData();

	return (
		<footer className={styles.footer}>
			<div className={styles.copyright}>
				@{new Date().getUTCFullYear()}, {footerText.copyright}
			</div>

			<div className={styles.section}>
				<Link href="/terms" className={styles.link}>
					{footerText.termsText}
				</Link>
				<Link href="/privacy" className={styles.link}>
					{footerText.privacyText}
				</Link>
				<Link href="/cookies" className={styles.link}>
					{footerText.cookiesText}
				</Link>
			</div>
		</footer>
	);
}
