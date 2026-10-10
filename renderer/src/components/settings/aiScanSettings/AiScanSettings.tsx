'use client';

import useTranslationData from '@/hooks/use-translation-data';
import { ChevronRight } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import styles from './AiScanSettings.module.css';

function AiScanSettings() {
	const { settingsPageText } = useTranslationData();
	const locale = useLocale();
	const [autoSave, setAutoSave] = useState(true);
	const [autoShare, setAutoShare] = useState(false);

	const toggleAutoSave = () => {
		setAutoSave(!autoSave);
	};

	const toggleAutoShare = () => {
		setAutoShare(!autoShare);
	};

	return (
		<div className={styles.section}>
			<div className={styles.subSection}>
				<p>{settingsPageText.aiScanSettings.autoSaveScanHistory}</p>
				<div
					onClick={toggleAutoSave}
					className={`${styles.toggle} ${autoSave ? styles.active : ''}`}
				>
					<span className={`${styles.thumb} ${autoSave ? styles.thumbActive : ''}`} />
				</div>
			</div>

			<div className={styles.subSection}>
				<p>{settingsPageText.aiScanSettings.autoShareScans}</p>
				<div
					onClick={toggleAutoShare}
					className={`${styles.toggle} ${autoShare ? styles.active : ''}`}
				>
					<span className={`${styles.thumb} ${autoShare ? styles.thumbActive : ''}`} />
				</div>
			</div>

			<button className={styles.button}>
				<p>{settingsPageText.aiScanSettings.predictionSensitivity}</p>
				<ChevronRight size={21} />
			</button>
		</div>
	);
}

export default AiScanSettings;
