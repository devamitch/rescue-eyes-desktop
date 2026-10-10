'use client';

import ReportCard from '@/components/dashboard/ReportCard/ReportCard';
import useTranslationData from '@/hooks/use-translation-data';
import { EyeMetrics } from '@/hooks/useEyeTracking';
import {
	Activity,
	AlertTriangle,
	Battery,
	Brain,
	Clock,
	Eye,
	Target,
	User,
	Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';
import styles from './EyeMetricsDisplay.module.css';

interface EyeMetricsDisplayProps {
	metrics: EyeMetrics;
	className?: string;
	faceAge?: number;
	eyeAge?: number;
}

const EyeMetricsDisplay: React.FC<EyeMetricsDisplayProps> = ({
	metrics,
	className = '',
	faceAge,
	eyeAge,
}) => {
	const [displayMetrics, setDisplayMetrics] = useState(metrics);
	const [hasNewData, setHasNewData] = useState(false);
	const { eyeMetricsDisplayText } = useTranslationData();
	const t = useTranslations();

	useEffect(() => {
		if (metrics.timestamp !== displayMetrics.timestamp) {
			setHasNewData(true);
			setDisplayMetrics(metrics);

			const timer = setTimeout(() => {
				setHasNewData(false);
			}, 1000 * 6);

			return () => clearTimeout(timer);
		}
	}, [metrics, displayMetrics.timestamp]);

	const getStatus = (value: number, type: string) => {
		switch (type) {
			case 'blinkRate':
				return value < 10
					? t.raw('strainLevels.high')
					: value < 15
						? t.raw('strainLevels.moderate')
						: t.raw('strainLevels.low');
			case 'perClose':
				return value > 40
					? t.raw('strainLevels.veryHigh')
					: value > 20
						? t.raw('strainLevels.high')
						: value > 5
							? t.raw('strainLevels.moderate')
							: t.raw('strainLevels.low');
			case 'strain':
				return metrics.strainText.toLowerCase();
			case 'tiredness':
				return metrics.tiredText.toLowerCase().replace(' ', '-');
			default:
				return t.raw('strainLevels.low');
		}
	};

	const MetricCard: React.FC<{
		icon: React.ReactNode;
		label: string;
		value: string | number;
		recommendedValue: string;
		status?: string;
		isNew?: boolean;
	}> = ({ icon, label, value, recommendedValue, status, isNew }) => (
		<div className={`${styles.metricCard} `}>
			<div className={styles.cardIcon}>{icon}</div>
			<div className={styles.cardContent}>
				<div className={styles.metricHeader}>
					<span className={styles.metricLabel}>{label}</span>
					<span className={styles.recommendedValue}>{recommendedValue}</span>
				</div>
				<div className={styles.metricValue} data-status={status}>
					{value}
				</div>
			</div>
		</div>
	);

	const leftMetrics = [
		{
			icon: <Eye size={36} />,
			label: eyeMetricsDisplayText.metricLabels.blinkRate,
			value: displayMetrics.blinkRate.toFixed(1),
			recommendedValue: eyeMetricsDisplayText.recommendedValues.blinkRate,
			status: getStatus(displayMetrics.blinkRate, 'blinkRate'),
		},
		{
			icon: <Activity size={36} />,
			label: eyeMetricsDisplayText.metricLabels.eyeClosure,
			value: `${displayMetrics.perClose.toFixed(1)} %`,
			recommendedValue: eyeMetricsDisplayText.recommendedValues.eyeClosure,
			status: getStatus(displayMetrics.perClose, 'perClose'),
		},
		{
			icon: <AlertTriangle size={36} />,
			label: eyeMetricsDisplayText.metricLabels.eyeStrain,
			value: displayMetrics.strainText,
			recommendedValue: eyeMetricsDisplayText.recommendedValues.eyeStrain,
			status: getStatus(0, 'strain'),
		},
		{
			icon: <Battery size={36} />,
			label: eyeMetricsDisplayText.metricLabels.tiredness,
			value: displayMetrics.tiredText,
			recommendedValue: eyeMetricsDisplayText.recommendedValues.tiredness,
			status: getStatus(0, 'tiredness'),
		},
		{
			icon: <Brain size={36} />,
			label: eyeMetricsDisplayText.metricLabels.attentionLevel,
			value: `${(displayMetrics.attentionFrac * 100).toFixed(1)} %`,
			recommendedValue: eyeMetricsDisplayText.recommendedValues.attentionLevel,
			status: displayMetrics.attBinary
				? t.raw('strainLevels.low')
				: t.raw('strainLevels.high'),
		},
	];

	const rightMetrics = [
		{
			icon: <User size={36} />,
			label: eyeMetricsDisplayText.metricLabels.eyeAge,
			value: eyeAge
				? `${eyeAge} ${eyeMetricsDisplayText.units.years}`
				: displayMetrics.eyeAge,
			recommendedValue: eyeMetricsDisplayText.recommendedValues.eyeAge,
			status: t.raw('strainLevels.low'),
		},
		{
			icon: <Clock size={36} />,
			label: eyeMetricsDisplayText.metricLabels.faceAge,
			value: faceAge ? `${faceAge} ${eyeMetricsDisplayText.units.years}` : '0',
			recommendedValue: eyeMetricsDisplayText.recommendedValues.faceAge,
		},
		{
			icon: <Target size={36} />,
			label: eyeMetricsDisplayText.metricLabels.eyeAspectRatio,
			value: displayMetrics.eyeAspectRatio.toFixed(3),
			recommendedValue: eyeMetricsDisplayText.recommendedValues.eyeAspectRatio,
		},
		{
			icon: <Activity size={36} />,
			label: eyeMetricsDisplayText.metricLabels.pupilDilation,
			value: displayMetrics.pupilDilation.toFixed(1),
			recommendedValue: eyeMetricsDisplayText.recommendedValues.pupilDilation,
		},
		{
			icon: <Zap size={36} />,
			label: eyeMetricsDisplayText.metricLabels.squintIntensity,
			value: `${displayMetrics.squintIntensity.toFixed(1)} %`,
			recommendedValue: eyeMetricsDisplayText.recommendedValues.squintIntensity,
		},
	];

	const allMetrics = [...leftMetrics, ...rightMetrics];

	return (
		<div className={`${styles.container} ${className}`}>
			<div className={styles.metricsLayout}>
				<div className={styles.leftMetrics}>
					{leftMetrics.map((metric, index) => (
						<MetricCard
							key={metric.label}
							icon={metric.icon}
							label={metric.label}
							value={metric.value}
							recommendedValue={metric.recommendedValue}
							status={metric.status}
							isNew={hasNewData}
						/>
					))}
				</div>

				<div className={styles.centerReport}>
					<ReportCard />
				</div>
				<div className={styles.rightMetrics}>
					{rightMetrics.map((metric, index) => (
						<MetricCard
							key={metric.label}
							icon={metric.icon}
							label={metric.label}
							value={metric.value}
							recommendedValue={metric.recommendedValue}
							status={metric.status}
							isNew={hasNewData}
						/>
					))}
				</div>
				<div className={styles.metrics}>
					{allMetrics.map((metric) => (
						<MetricCard
							key={metric.label}
							icon={metric.icon}
							label={metric.label}
							value={metric.value}
							recommendedValue={metric.recommendedValue}
							status={metric.status}
							isNew={hasNewData}
						/>
					))}
				</div>
			</div>
		</div>
	);
};

export default EyeMetricsDisplay;
