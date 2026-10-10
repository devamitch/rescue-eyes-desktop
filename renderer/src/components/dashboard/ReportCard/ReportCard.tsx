'use client';
import useTranslationData from '@/hooks/use-translation-data';
import useAppStore from '@/store';
import { Eye, Laugh, SquareCheckBigIcon } from 'lucide-react';
import styles from './ReportCard.module.css';

const ReportCard = () => {
	const eyeTracking = useAppStore?.((state) => state?.eyeTracking) || {};
	const currentMetrics = eyeTracking?.currentMetrics || {};
	const history = eyeTracking?.history || [];
	const selectedTimeframe = eyeTracking?.selectedTimeframe || 'daily';
	const selectedDate = eyeTracking?.selectedDate || null;
	const getMetricsForDate = eyeTracking?.getMetricsForDate || (() => ({}));
	const { reportCardText } = useTranslationData();

	// Get metrics for the selected date or use current metrics
	const getMetricsForDisplay = () => {
		if (selectedDate) {
			const dateMetrics = getMetricsForDate?.(selectedDate);
			if (dateMetrics.length > 0) {
				// Return the most recent metrics for the selected date
				return dateMetrics[dateMetrics.length - 1];
			}
		}

		// Fallback to most recent metrics for the selected timeframe
		const recentMetrics =
			history[selectedTimeframe]?.[history[selectedTimeframe].length - 1] || currentMetrics;
		return recentMetrics;
	};

	const displayMetrics = getMetricsForDisplay?.();

	// Calculate overall health score based on metrics
	const calculateHealthScore = () => {
		const blinkScore = Math.max(0, Math.min(100, (displayMetrics.blinkRate / 20) * 100));
		const strainScore = Math.max(0, 100 - displayMetrics.strainLevelIdx * 33);
		const attentionScore = displayMetrics.attentionFrac * 100;
		const tiredScore = Math.max(0, 100 - displayMetrics.perClose * 2);

		return Math.round((blinkScore + strainScore + attentionScore + tiredScore) / 4);
	};

	const healthScore = calculateHealthScore();
	const progressValue = (healthScore / 100) * 180;

	// Get the timestamp for display
	const getDisplayTimestamp = () => {
		if (selectedDate) {
			const dateMetrics = getMetricsForDate?.(selectedDate);
			if (dateMetrics.length > 0) {
				return new Date(dateMetrics[dateMetrics.length - 1].timestamp).toLocaleString(
					'en-US',
					{
						day: '2-digit',
						month: 'short',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
						hour12: false,
					}
				);
			}
		}

		const data = history[selectedTimeframe];
		if (data && data.length > 0) {
			return new Date(data[data.length - 1].timestamp).toLocaleString('en-US', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			});
		}
		return new Date().toLocaleString('en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
		});
	};

	// Determine condition based on metrics
	const getCondition = () => {
		if (displayMetrics.strainText === 'High' || displayMetrics.tiredText === 'Very High') {
			return reportCardText.conditions.high;
		} else if (
			displayMetrics.strainText === 'Moderate' ||
			displayMetrics.tiredText === 'High'
		) {
			return reportCardText.conditions.moderate;
		} else {
			return reportCardText.conditions.normal;
		}
	};

	// Get appropriate emoji based on health score
	const getEmoji = () => {
		if (healthScore >= 80) return Laugh;
		if (healthScore >= 60) return Eye;
		return Eye; // Default to eye icon for lower scores
	};

	const EmojiIcon = getEmoji();

	return (
		<div className={styles.card}>
			<div>
				<div className={styles.header}>
					<div className={styles.titleSection}>
						<div>
							<h2 className={styles.title}>
								<Eye />
								{reportCardText.title}
							</h2>
							<p className={styles.subtitle}>
								{reportCardText.subtitle} {Math.round(healthScore)}%
							</p>
						</div>
					</div>
					<p className={styles.date}>{getDisplayTimestamp?.()}</p>
				</div>
				<p className={styles.conditionSection}>
					<SquareCheckBigIcon size={20} /> {getCondition()}
				</p>
			</div>

			<div>
				<div className={styles.progressWrapper}>
					<div
						className={styles.progress}
						style={
							{
								'--progress-rotation': `${progressValue}deg`,
							} as React.CSSProperties & Record<string, string>
						}
					/>
					<div className={styles.emojiCircle}>
						<span className={styles.emoji}>
							<EmojiIcon />
						</span>
					</div>
				</div>

				<div className={styles.statsBox}>
					<p className={styles.statsValue}>{healthScore}%</p>
					<p className={styles.statsFooter}>{reportCardText.statsFooter}</p>
				</div>
			</div>
		</div>
	);
};

export default ReportCard;
