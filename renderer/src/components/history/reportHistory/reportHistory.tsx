'use client';
import useTranslationData from '@/hooks/use-translation-data';
import { useRouter } from '@/i18n/navigation';
import useAppStore from '@/store';
import { Clock, Search } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './reportHistory.module.css';

function ReportHistory() {
	const router = useRouter();
	const { history, selectedTimeframe } = useAppStore((state) => state.eyeTracking);
	const { historyReportText } = useTranslationData();

	const [searchTerm, setSearchTerm] = useState('');
	const [selectedDate, setSelectedDate] = useState<string>(
		new Date().toISOString().split('T')[0]
	);

	const historyData = useMemo(() => {
		const data = history[selectedTimeframe] || [];
		return data
			.filter((item: any) => {
				const matchesSearch =
					searchTerm === '' ||
					item.strainText.toLowerCase().includes(searchTerm.toLowerCase()) ||
					item.tiredText.toLowerCase().includes(searchTerm.toLowerCase());

				const matchesDate = selectedDate
					? new Date(item.timestamp).toISOString().split('T')[0] === selectedDate
					: true;

				return matchesSearch && matchesDate;
			})
			.sort(
				(a: any, b: any) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
			);
	}, [history, selectedTimeframe, searchTerm, selectedDate]);

	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedDate(e.target.value || new Date().toISOString().split('T')[0]);
	};

	const getStatusColor = (strainText: string) => {
		switch (strainText) {
			case 'Low':
				return styles.normal;
			case 'Moderate':
				return styles.blinkrate;
			case 'High':
				return styles.eyestrain;
			default:
				return styles.normal;
		}
	};

	const getStatusText = (strainText: string) => {
		switch (strainText) {
			case 'Low':
				return historyReportText.statusLabels.normal;
			case 'Moderate':
				return historyReportText.statusLabels.blinkRate;
			case 'High':
				return historyReportText.statusLabels.eyeStrain;
			default:
				return historyReportText.statusLabels.normal;
		}
	};

	const getStatusType = (strainText: string) => {
		switch (strainText) {
			case 'Low':
				return '';
			case 'Moderate':
				return historyReportText.statusTypes.blinkRate;
			case 'High':
				return historyReportText.statusTypes.eyeStrain;
			default:
				return '';
		}
	};

	const getActionText = (strainText: string) => {
		return strainText === 'Low'
			? historyReportText.actions.quickView
			: historyReportText.actions.viewReport;
	};

	const handleViewReport = (report: any) => {
		const timestamp = new Date(report.timestamp).getTime();
		router.push(`/history/report/${timestamp}`);
	};

	useEffect(() => {
		if (!selectedDate) {
			setSelectedDate(new Date().toISOString().split('T')[0]);
		}
	}, [selectedDate, setSelectedDate]);

	return (
		<div className={styles.reportHistory}>
			<h2>{historyReportText.title}</h2>
			<div className={styles.filters}>
				<div className={styles.dateRange}>
					<input
						type="date"
						value={selectedDate || new Date().toISOString().split('T')[0]}
						onChange={handleDateChange}
						className={styles.dateInput}
					/>
				</div>

				<div className={styles.scanType}>
					<input
						type="text"
						placeholder={historyReportText.filters.scanTypePlaceholder}
						className={styles.scanTypeInput}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					<Search size={16} className={styles.searchIcon} />
				</div>
			</div>
			<div className={styles.tableContainer}>
				<div className={styles.historyTable}>
					<div className={styles.tableHeader}>
						<span>{historyReportText.tableHeaders.date}</span>
						<span>{historyReportText.tableHeaders.results}</span>
						<span>{historyReportText.tableHeaders.actions}</span>
					</div>
					<div className={styles.tableBody}>
						{historyData.length > 0 ? (
							historyData.map((report: any, index: number) => {
								const date = new Date(report.timestamp);
								const formattedDate = date.toLocaleDateString('en-US', {
									month: 'long',
									day: 'numeric',
									year: 'numeric',
								});
								const formattedTime = date.toLocaleTimeString('en-US', {
									hour: '2-digit',
									minute: '2-digit',
								});
								return (
									<React.Fragment key={index}>
										<div className={styles.tableRow}>
											<div className={styles.date}>
												<p>{formattedDate}</p>
												<p className={styles.time}>{formattedTime}</p>
											</div>
											<div className={styles.result}>
												<span
													className={`${styles.status} ${getStatusColor(report.strainText)}`}
												>
													{getStatusText(report.strainText)}
												</span>
												{report.strainText !== 'Low' && (
													<div className={styles.statusType}>
														{getStatusType(report.strainText)}
													</div>
												)}
											</div>
											<button
												className={styles.actionButton}
												onClick={() => handleViewReport(report)}
											>
												{getActionText(report.strainText)}
											</button>
										</div>
										{index < historyData.length - 1 && (
											<div className={styles.separator} />
										)}
									</React.Fragment>
								);
							})
						) : (
							<div className={styles.emptyState}>
								<Clock size={48} />
								<p>
									{historyReportText.emptyState.noHistory}{' '}
									{selectedDate
										? new Date(selectedDate).toLocaleDateString()
										: 'today'}
								</p>
								<p>{historyReportText.emptyState.startTracking}</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default ReportHistory;
