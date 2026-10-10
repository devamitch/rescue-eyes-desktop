'use client';
import useTranslationData from '@/hooks/use-translation-data';
import { EyeMetrics } from '@/hooks/useEyeTracking';
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import { withLazyLoad } from '@/provider/LazyLoad';
import useAppStore from '@/store';
import { MetricsCardData } from '@/types';
import { Clock, Eye, EyeOff, View, PlayCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './livepage.module.css';
import EyeScanModal from '@/components/dashboard/EyeScanModal/EyeScanModal';

// Lazy load metric cards
const LazyBlinkRateCard = withLazyLoad(
	() => import('@/components/dashboard/MetricCards/BlinkRateCard')
);
const LazyEyeAgeCard = withLazyLoad(() => import('@/components/dashboard/MetricCards/EyeAgeCard'));
const LazyEyeStrainCard = withLazyLoad(
	() => import('@/components/dashboard/MetricCards/EyeStrainCard')
);
const LazyScreenTimeCard = withLazyLoad(
	() => import('@/components/dashboard/MetricCards/ScreenTimeCard')
);
const LazyReportCard = withLazyLoad(() => import('@/components/dashboard/ReportCard/ReportCard'));

const formatDuration = (seconds: number): string => {
	if (seconds === 0) return '0m';

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	if (hours > 0) {
		return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	}
	return `${minutes}m`;
};

const LiveDashboard = () => {
	const {
		videoRef,
		canvasRef,
		metrics,
		loading,
		error,
		isActive,
		cameraReady,
		streamData,
		startTracking,
		stopTracking,
		getMetricsHistory,
	} = useEyeTrackingContext();
	const { livePageText } = useTranslationData();

	const { dailyScreenTime, screenTimeByHour = [] } = useAppStore((state) => state.screenTime);

	const [currentTime, setCurrentTime] = useState(Date.now());
	const [isEyeScanModalOpen, setIsEyeScanModalOpen] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(Date.now());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const metricsHistory = useMemo(() => {
		const allHistory = getMetricsHistory() || [];
		const thirtyMinutesAgo = currentTime - 30 * 60 * 1000;

		return allHistory.filter((metric) => {
			const metricTime = metric.timestamp ? new Date(metric.timestamp).getTime() : Date.now();
			return metricTime >= thirtyMinutesAgo;
		});
	}, [getMetricsHistory, currentTime]);

	const generateChartData = useCallback((history: EyeMetrics[], key: keyof EyeMetrics) => {
		const now = Date.now();
		const thirtyMinutesAgo = now - 30 * 60 * 1000;

		return (
			history
				?.filter((metric) => {
					const metricTime = metric.timestamp
						? new Date(metric.timestamp).getTime()
						: now;
					return metricTime >= thirtyMinutesAgo;
				})
				?.map?.((metric, index, filteredArray) => ({
					v: Number(metric[key]) || 0,
					high: Number(metric[key]) > (key === 'blinkRate' ? 15 : 50),
					timestamp: metric.timestamp
						? new Date(metric.timestamp).getTime()
						: now - (filteredArray.length - index) * 1000,
					timeLabel: metric.timestamp
						? new Date(metric.timestamp).toLocaleTimeString('en-US', {
								hour12: false,
								minute: '2-digit',
								second: '2-digit',
							})
						: '',
				})) || []
		);
	}, []);

	const metricsData: MetricsCardData[] = useMemo(
		() => [
			{
				name: livePageText.metricNames.blinkRate,
				value: metrics?.blinkRate?.toFixed(1) || '0',
				unit: livePageText.units.perMin,
				icon: <EyeOff />,
				graphData: generateChartData(metricsHistory, 'blinkRate'),
				status: metrics?.strainText.toLowerCase() || 'low',
			},
			{
				name: livePageText.metricNames.eyeStrain,
				value: metrics?.strainLevelIdx ?? 0,
				unit: livePageText.units.level,
				icon: <Eye />,
				graphData: generateChartData(metricsHistory, 'strainLevelIdx'),
				status: metrics?.strainText.toLowerCase() || 'low',
			},
			{
				name: livePageText.metricNames.eyeAge,
				value: metrics?.eyeAge || 'N/A',
				unit: livePageText.units.years,
				icon: <View />,
				graphData: generateChartData(metricsHistory, 'eyeAge'),
				status: metrics?.tiredText.toLowerCase().replace(' ', '-') || 'low',
			},
			{
				name: livePageText.metricNames.screenTime,
				value: dailyScreenTime ? formatDuration(dailyScreenTime) : '0m',
				icon: <Clock />,
				graphData: (screenTimeByHour || [])?.map?.((minutes, hour) => ({
					v: minutes,
					high: minutes > 60,
					hour: hour,
				})),
				status: dailyScreenTime > 180 * 60 ? 'high' : 'low',
			},
		],
		[
			livePageText.metricNames.blinkRate,
			livePageText.metricNames.eyeStrain,
			livePageText.metricNames.eyeAge,
			livePageText.metricNames.screenTime,
			livePageText.units.perMin,
			livePageText.units.level,
			livePageText.units.years,
			metrics?.blinkRate,
			metrics?.strainText,
			metrics?.strainLevelIdx,
			metrics?.eyeAge,
			metrics?.tiredText,
			generateChartData,
			metricsHistory,
			dailyScreenTime,
			screenTimeByHour,
		]
	);

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

	const handleOpenEyeScan = useCallback(() => {
		setIsEyeScanModalOpen(true);
	}, []);

	const handleCloseEyeScan = useCallback(() => {
		setIsEyeScanModalOpen(false);
	}, []);

	return (
		<div className={styles.container} style={{ flex: 1 }}>
			{/* Hero Section with Eye Scan Button */}
			<div className={styles.heroSection}>
				<div className={styles.welcomeText}>
					<h1>Welcome to Live Eye Tracking</h1>
					<p>Monitor your eye health in real-time and get instant assessments</p>
				</div>
				
				<div className={styles.eyeScanSection}>
					<div className={styles.scanPrompt}>
						<div className={styles.scanIcon}>
							<Eye size={48} />
						</div>
						<h3>Get 30 Second Quick Eye Scan Done</h3>
						<p>Position yourself comfortably and look at the camera during the scan</p>
						<button 
							onClick={handleOpenEyeScan} 
							className={styles.startButton}
							disabled={!cameraReady && !isActive}
						>
							<PlayCircle size={20} />
							Start Scan
						</button>
					</div>
				</div>
			</div>
			<EyeScanModal
				isOpen={isEyeScanModalOpen}
				onClose={handleCloseEyeScan}
				currentMetrics={metrics}
			/>
			{/* {error && (
				<div className={styles.errorBanner}>
					<span>Error: {error}</span>
					<button onClick={handleToggleTracking} className={styles.retryButton}>
						{livePageText.errorRetry}
					</button>
				</div>
			)}

			<div className={styles.mainSection}>
				<div className={styles.leftMetrics}>
					<LazyBlinkRateCard data={metricsData[0]} metrics={metrics} />
					<LazyEyeAgeCard
						data={metricsData[2]}
						metrics={metrics}
						faceAge={metrics?.faceAge}
					/>
				</div>

				<div className={styles.cameraSection}>
					<LazyReportCard />
				</div>

				<div className={styles.rightMetrics}>
					<LazyEyeStrainCard data={metricsData[1]} metrics={metrics} />
					<LazyScreenTimeCard data={metricsData[3]} metrics={metrics} />
				</div>
			</div> */}

		</div>
	);
};

export default LiveDashboard;
