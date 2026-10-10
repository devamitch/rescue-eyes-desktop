import Dialog from '@/components/layout/Modal/Dialog';
import useTranslationData from '@/hooks/use-translation-data';
import { EyeMetrics } from '@/hooks/useEyeTracking';
import { Eye, PlayCircle, StopCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import styles from './EyeScanModal.module.css';

interface EyeScanModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentMetrics: EyeMetrics | null;
}

interface MetricComparison {
	before: EyeMetrics | null;
	after: EyeMetrics | null;
}

const EyeScanModal: React.FC<EyeScanModalProps> = ({
	isOpen,
	onClose,
	currentMetrics,
}) => {
	const [isScanning, setIsScanning] = useState(false);
	const [scanCompleted, setScanCompleted] = useState(false);
	const [countdown, setCountdown] = useState(30);
	const [metricsComparison, setMetricsComparison] = useState<MetricComparison>({
		before: null,
		after: null,
	});

	const { livePageText } = useTranslationData();

	const handleStartScan = () => {
		// Capture before metrics
		if (currentMetrics) {
			setMetricsComparison({
				before: { ...currentMetrics },
				after: null,
			});
		}
		setIsScanning(true);
		setScanCompleted(false);
		setCountdown(30);
	};

	const handleStopScan = () => {
		setIsScanning(false);
		if (currentMetrics) {
			setMetricsComparison((prev) => ({
				...prev,
				after: { ...currentMetrics },
			}));
		}
		setScanCompleted(true);
	};

	const handleClose = () => {
		setIsScanning(false);
		setScanCompleted(false);
		setCountdown(30);
		setMetricsComparison({ before: null, after: null });
		onClose();
	};

	// Auto-start scan when modal opens
	useEffect(() => {
		if (isOpen && !isScanning && !scanCompleted) {
			handleStartScan();
		}
	}, [isOpen]);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		
		if (isScanning && countdown > 0) {
			interval = setInterval(() => {
				setCountdown((prev) => {
					if (prev <= 1) {
						setIsScanning(false);
						setScanCompleted(true);
						// Capture after metrics
						if (currentMetrics) {
							setMetricsComparison((prevMetrics) => ({
								...prevMetrics,
								after: { ...currentMetrics },
							}));
						}
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isScanning, countdown, currentMetrics]);

	const getStatusClass = (value: number, type: 'blinkRate' | 'perClose' | 'strainLevel') => {
		if (type === 'blinkRate') {
			if (value <= 10) return styles.poor;
			if (value <= 15) return styles.good;
			if (value <= 20) return styles.moderate;
			return styles.high;
		}
		if (type === 'perClose') {
			if (value <= 20) return styles.good;
			if (value <= 40) return styles.moderate;
			return styles.poor;
		}
		if (type === 'strainLevel') {
			if (value <= 1) return styles.good;
			if (value <= 2) return styles.moderate;
			return styles.poor;
		}
		return styles.good;
	};

	const renderMetrics = (metrics: EyeMetrics | null, title: string) => {
		if (!metrics) return null;

		return (
			<div className={styles.metricsSection}>
				<h4 className={styles.metricsTitle}>{title}</h4>
				<div className={styles.metricsGrid}>
					<div className={styles.metricItem}>
						<span className={styles.metricLabel}>Blink Rate</span>
						<span className={`${styles.metricValue} ${getStatusClass(metrics.blinkRate, 'blinkRate')}`}>
							{metrics.blinkRate.toFixed(1)} bpm
						</span>
					</div>
					<div className={styles.metricItem}>
						<span className={styles.metricLabel}>Eye Closure</span>
						<span className={`${styles.metricValue} ${getStatusClass(metrics.perClose, 'perClose')}`}>
							{metrics.perClose.toFixed(1)}%
						</span>
					</div>
					<div className={styles.metricItem}>
						<span className={styles.metricLabel}>Strain Level</span>
						<span className={`${styles.metricValue} ${styles[metrics.strainText.toLowerCase()]}`}>
							{metrics.strainText}
						</span>
					</div>
					<div className={styles.metricItem}>
						<span className={styles.metricLabel}>Attention</span>
						<span className={`${styles.metricValue} ${metrics.attBinary ? styles.good : styles.poor}`}>
							{metrics.attBinary ? 'Good' : 'Poor'}
						</span>
					</div>
				</div>
			</div>
		);
	};

	return (
		<Dialog isOpen={isOpen} onClose={handleClose}>
			<div className={styles.modalContainer}>
				<div className={styles.header}>
					<div className={styles.headerIcon}>
						<Eye size={24} />
					</div>
					<h2 className={styles.title}>Quick Eye Scan</h2>
					<p className={styles.subtitle}>Get a 30-second comprehensive eye health assessment</p>
				</div>

				<div className={styles.scanArea}>
					{isScanning && (
						<div className={styles.scanningArea}>
							<div className={styles.scanningIcon}>
								<Eye size={48} className={styles.pulsingEye} />
							</div>
							<h3>Scanning in Progress...</h3>
							<div className={styles.countdown}>{countdown}s</div>
							<div className={styles.progressBar}>
								<div 
									className={styles.progressFill} 
									style={{ width: `${((30 - countdown) / 30) * 100}%` }}
								></div>
							</div>
						</div>
					)}

					{scanCompleted && (
						<div className={styles.resultsArea}>
							<h3>Scan Completed!</h3>
							<div className={styles.comparisonResults}>
								{renderMetrics(metricsComparison.before, 'Before Scan')}
								{renderMetrics(metricsComparison.after, 'After Scan')}
							</div>
						</div>
					)}
				</div>

				<div className={styles.footer}>
					{isScanning && (
						<button onClick={handleStopScan} className={styles.stopButton}>
							<StopCircle size={20} />
							Stop Scan
						</button>
					)}

					{scanCompleted && (
						<button onClick={handleClose} className={styles.closeButton}>
							Close
						</button>
					)}
				</div>
			</div>
		</Dialog>
	);
};

export default EyeScanModal;