'use client';
import useTranslationData from '@/hooks/use-translation-data';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import styles from './notifications.module.css';

function Notifications() {
	const [autoSave, setAutoSave] = useState(true);
	const [autoShare, setAutoShare] = useState(false);
	const { settingsPageText } = useTranslationData();
	const locale = useLocale();

	const toggleAutoSave = () => {
		setAutoSave(!autoSave);
	};

	const toggleAutoShare = () => {
		setAutoShare(!autoShare);
	};

	return (
		<div className={styles.section}>
			<div className={styles.subSection}>
				<p>{settingsPageText.notifications.healthScanReport}</p>
				<div
					onClick={toggleAutoSave}
					className={`${styles.toggle} ${autoSave ? styles.active : ''}`}
				>
					<span className={`${styles.thumb} ${autoSave ? styles.thumbActive : ''}`} />
				</div>
			</div>
			<div className={styles.subSection}>
				<p>{settingsPageText.notifications.newProductArticles}</p>
				<div
					onClick={toggleAutoShare}
					className={`${styles.toggle} ${autoShare ? styles.active : ''}`}
				>
					<span className={`${styles.thumb} ${autoShare ? styles.thumbActive : ''}`} />
				</div>
			</div>
		</div>
	);
}

export default Notifications;
