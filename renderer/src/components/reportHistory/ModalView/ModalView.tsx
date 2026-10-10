import Dialog from '@/components/layout/Modal/Dialog';
import useTranslationData from '@/hooks/use-translation-data';
import { Activity, AlertTriangle, Battery, Brain, Eye, Zap } from 'lucide-react';
import { useLocale } from 'next-intl';
import styles from './modalview.module.css';

interface ModalViewProps {
	isModalOpen: boolean;
	closeModal: () => void;
	selectedReport: any;
	getStatusColor: (strainText: string) => string;
	getStatusText: (strainText: string) => string;
}

const ModalView: React.FC<ModalViewProps> = ({
	isModalOpen,
	closeModal,
	selectedReport,
	getStatusColor,
	getStatusText,
}) => {
	const { modalViewText } = useTranslationData();
	const locale = useLocale();
	const metricCards = selectedReport
		? [
				{
					title: modalViewText.metricCards.blinkRate.title,
					value: selectedReport.blinkRate,
					unit: modalViewText.metricCards.blinkRate.unit,
					icon: Eye,
				},
				{
					title: modalViewText.metricCards.eyeClosure.title,
					value: `${selectedReport.perClose?.toFixed(2)}%`,
					icon: Activity,
				},
				{
					title: modalViewText.metricCards.attentionLevel.title,
					value: `${(selectedReport.attentionFrac * 100).toFixed(1)}%`,
					icon: Brain,
				},
				{
					title: modalViewText.metricCards.strainLevel.title,
					value: selectedReport.strainText,
					colorClass: getStatusColor(selectedReport.strainText),
					icon: AlertTriangle,
				},
				{
					title: modalViewText.metricCards.tirednessLevel.title,
					value: selectedReport.tiredText,
					icon: Battery,
				},
				{
					title: modalViewText.metricCards.eyeAspectRatio.title,
					value: selectedReport.eyeAspectRatio?.toFixed(3),
					icon: Zap,
				},
			]
		: [];

  return (
<Dialog isOpen={isModalOpen} onClose={closeModal}>
				{selectedReport && (
						<>
							<div className={styles.reportDetailHeader}>
								<div className={styles.reportTimestamp}>
									{new Date(selectedReport.timestamp).toLocaleString()}
								</div>
								<div className={`${styles.reportStatus} ${getStatusColor(selectedReport.strainText)}`}>
									{getStatusText(selectedReport.strainText)}
								</div>
							</div>

							<div className={styles.reportMetrics}>
								{metricCards.map((metric, index) => {
									return (
										<div key={index} className={styles.metricCard}>
											<metric.icon size={24} className={styles.cardIcon} />
											<h4>{metric.title}</h4>
											<h5 className={styles.metricUnit}>{metric.unit}</h5>
											<h2 className={`${styles.metricValue} ${metric.colorClass || ''}`}>
												{metric.value}
											</h2>
										</div>
									);
								})}
							</div>
						</>
					)}
				</Dialog>
  )
}

export default ModalView;
