'use client';

import useTranslationData from '@/hooks/use-translation-data';
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import { withLazyLoad } from '@/provider/LazyLoad';
import { useCallback } from 'react';
import styles from './dashboard.module.scss';

const LazyEyeMetricsDisplay = withLazyLoad(
	() => import('@/components/dashboard/EyeTracking/EyeMetricDisplay/EyeMetricsDisplay')
);
const LazyReportHistory = withLazyLoad(
	() => import('@/components/dashboard/ReportHistory/ReportHistory')
);

export default function DashboardPage() {
	const { metrics, error, isActive, startTracking, stopTracking } = useEyeTrackingContext();
	const { dashboardPageText } = useTranslationData();

	const handleToggleTracking = useCallback(async () => {
		if (isActive) {
			stopTracking();
		} else {
			try {
				await startTracking();
			} catch (err) {
				console.error('Failed to start tracking:', err);
			}
		}
	}, [isActive, startTracking, stopTracking]);

	return (
		<div className={styles.container}>
			{error && (
				<div className={styles.errorBanner}>
					<span>
						{dashboardPageText.errorMessage} {error}
					</span>
					<button onClick={handleToggleTracking} className={styles.retryButton}>
						{dashboardPageText.retryButton}
					</button>
				</div>
			)}

			<div className={styles.streamSection}>
				{metrics && (
					<LazyEyeMetricsDisplay
						metrics={metrics}
						className={styles.metricsPanel}
						faceAge={metrics?.faceAge}
						eyeAge={metrics?.eyeAge}
					/>
				)}
			</div>
			<LazyReportHistory />
		</div>
	);
}
