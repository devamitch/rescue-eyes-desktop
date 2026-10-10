import ModalComp from '@/components/layout/Modal/modal';
import useTranslationData from '@/hooks/use-translation-data';
import { EyeMetrics } from '@/hooks/useEyeTracking';
import { ExerciseCardData } from '@/types';
import React, { useEffect, useRef, useState } from 'react';
import styles from './ExerciseModal.module.css';
import Dialog from '@/components/layout/Modal/Dialog';
import FooterButton from './FooterButton/FooterButton';

interface ExerciseModalProps {
	isOpen: boolean;
	onClose: () => void;
	exercise: ExerciseCardData | null;
	currentMetrics: EyeMetrics | null;
}

interface MetricComparison {
	before: EyeMetrics | null;
	after: EyeMetrics | null;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({
	isOpen,
	onClose,
	exercise,
	currentMetrics,
}) => {
	const [videoEnded, setVideoEnded] = useState(false);
	const [metricsComparison, setMetricsComparison] = useState<MetricComparison>({
		before: null,
		after: null,
	});
	const [videoStarted, setVideoStarted] = useState(false);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const { exerciseModalText } = useTranslationData();

	useEffect(() => {
		if (isOpen && !videoStarted && currentMetrics) {
			setMetricsComparison((prev) => ({
				...prev,
				before: { ...currentMetrics },
			}));
			setVideoStarted(true);
		}
	}, [isOpen, currentMetrics, videoStarted]);

	const handleExerciseComplete = () => {
		if (currentMetrics) {
			setVideoEnded(true);
			setMetricsComparison((prev) => ({
				...prev,
				after: { ...currentMetrics },
			}));
		}
	};

	const handleRestartExercise = () => {
		if (currentMetrics) {
			setVideoEnded(false);
			setMetricsComparison({
				before: { ...currentMetrics },
				after: null,
			});
		}
	};

	const handleClose = () => {
		setVideoEnded(false);
		setVideoStarted(false);
		setMetricsComparison({ before: null, after: null });
		onClose();
	};

	if (!exercise) return null;

	const getStatusClass = (value: number, type: string) => {
		switch (type) {
			case 'blinkRate':
				return value < 10 ? styles.high : value < 15 ? styles.moderate : styles.low;
			case 'perClose':
				return value > 40
					? styles.veryHigh
					: value > 20
						? styles.high
						: value > 5
							? styles.moderate
							: styles.low;
			default:
				return styles.normal;
		}
	};

	const MetricsDisplay: React.FC<{ metrics: EyeMetrics; title: string }> = ({
		metrics,
		title,
	}) => (
		<div className={styles.metricsSection}>
			<h4 className={styles.metricsTitle}>{title}</h4>
			<div className={styles.metricsGrid}>
				<div className={styles.metricItem}>
					<span className={styles.metricLabel}>
						{exerciseModalText.metricLabels.blinkRate}
					</span>
					<span
						className={`${styles.metricValue} ${getStatusClass(metrics.blinkRate, 'blinkRate')}`}
					>
						{metrics.blinkRate.toFixed(1)}
						{exerciseModalText.units.bpm}
					</span>
				</div>

				<div className={styles.metricItem}>
					<span className={styles.metricLabel}>
						{exerciseModalText.metricLabels.eyeClosure}
					</span>
					<span
						className={`${styles.metricValue} ${getStatusClass(metrics.perClose, 'perClose')}`}
					>
						{metrics.perClose.toFixed(1)}%
					</span>
				</div>

				<div className={styles.metricItem}>
					<span className={styles.metricLabel}>
						{exerciseModalText.metricLabels.strainLevel}
					</span>
					<span
						className={`${styles.metricValue} ${styles[metrics.strainText.toLowerCase()]}`}
					>
						{metrics.strainText}
					</span>
				</div>

				<div className={styles.metricItem}>
					<span className={styles.metricLabel}>
						{exerciseModalText.metricLabels.attention}
					</span>
					<span
						className={`${styles.metricValue} ${metrics.attBinary ? styles.good : styles.poor}`}
					>
						{metrics.attBinary
							? exerciseModalText.attentionStates.good
							: exerciseModalText.attentionStates.poor}
					</span>
				</div>
			</div>
		</div>
	);

  return (
<Dialog
      isOpen={isOpen} 
      onClose={handleClose}
      footer={<FooterButton videoEnded={videoEnded} handleExerciseComplete={handleExerciseComplete} handleRestartExercise={handleRestartExercise} />}    >

        <div >
          <div className={styles.videoContainer}>
            <iframe
              ref={iframeRef}
              src={exercise.youtubeUrl}
              title={exercise.title}
              allow=" autoplay"
              allowFullScreen
              className={styles.video}
            />
          </div>
        </div>

			<div className={styles.metricsContainer}>
				{!videoEnded && currentMetrics && (
					<div className={styles.metricsGrid}>
						<div className={styles.metricItem}>
							<span className={styles.metricLabel}>
								{exerciseModalText.metricLabels.blinkRate}
							</span>
							<span
								className={`${styles.metricValue} ${getStatusClass(currentMetrics.blinkRate, 'blinkRate')}`}
							>
								{currentMetrics.blinkRate.toFixed(1)}
								{exerciseModalText.units.bpm}
							</span>
						</div>

						<div className={styles.metricItem}>
							<span className={styles.metricLabel}>
								{exerciseModalText.metricLabels.eyeClosure}
							</span>
							<span
								className={`${styles.metricValue} ${getStatusClass(currentMetrics.perClose, 'perClose')}`}
							>
								{currentMetrics.perClose.toFixed(1)}%
							</span>
						</div>

						<div className={styles.metricItem}>
							<span className={styles.metricLabel}>
								{exerciseModalText.metricLabels.strainLevel}
							</span>
							<span
								className={`${styles.metricValue} ${styles[currentMetrics.strainText.toLowerCase()]}`}
							>
								{currentMetrics.strainText}
							</span>
						</div>

						<div className={styles.metricItem}>
							<span className={styles.metricLabel}>
								{exerciseModalText.metricLabels.attention}
							</span>
							<span
								className={`${styles.metricValue} ${currentMetrics.attBinary ? styles.good : styles.poor}`}
							>
								{currentMetrics.attBinary
									? exerciseModalText.attentionStates.good
									: exerciseModalText.attentionStates.poor}
							</span>
						</div>
					</div>
				)}

          {videoEnded && metricsComparison.before && metricsComparison.after && (
            <div className={styles.comparisonSection}>
              <h3 className={styles.comparisonTitle}>Exercise Results Comparison</h3>
              <div className={styles.comparisonGrid}>
                <MetricsDisplay metrics={metricsComparison.before} title="Before Exercise" />
                <MetricsDisplay metrics={metricsComparison.after} title="After Exercise" />
              </div>
            </div>
          )}
        </div>
    </Dialog>
  );
};

export default ExerciseModal;
