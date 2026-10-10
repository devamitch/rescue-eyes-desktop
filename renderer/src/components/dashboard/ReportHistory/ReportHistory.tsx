'use client';
import TitleHeader from '@/components/layout/Title/TitleHeader';
import ModalView from '@/components/reportHistory/ModalView/ModalView';
import useTranslationData from '@/hooks/use-translation-data';
import useAppStore from '@/store';
import { BarChart3, Clock, Eye, Table } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import styles from './reporthistory.module.css';

// Memoize the CustomTooltip component to prevent re-renders

const CustomTooltip = ({ active, payload, label, reportHistoryText }: any) => {
	if (active && payload && payload.length) {
		return (
			<div className={styles.customTooltip}>
				<p className={styles.tooltipLabel}>{label}</p>
				{payload.map((entry: any, index: number) => (
					<p key={index} className={styles.tooltipValue} style={{ color: entry.color }}>
						{entry.name}: {entry.value}
						{entry.name === 'Blink Rate'
							? reportHistoryText.tooltipUnits.blinks
							: entry.name === 'Eye Closure'
								? reportHistoryText.tooltipUnits.percentage
								: entry.name === 'Attention'
									? reportHistoryText.tooltipUnits.percentage
									: reportHistoryText.tooltipUnits.years}
					</p>
				))}
			</div>
		);
	}
	return null;
};

// Memoize the tooltip component with reportHistoryText
const MemoizedCustomTooltip = ({ active, payload, label, reportHistoryText }: any) => {
	return (
		<CustomTooltip
			active={active}
			payload={payload}
			label={label}
			reportHistoryText={reportHistoryText}
		/>
	);
};

function ReportHistory() {
	const { history, selectedTimeframe } = useAppStore((state) => state.eyeTracking);
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedReport, setSelectedReport] = useState<any>(null);
	const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
	const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
	const { reportHistoryText, dashboardPageText } = useTranslationData();

	console.log({ history, selectedTimeframe });
	// Process data based on selected timeframe
	const chartData = useMemo(() => {
		const data = history[selectedTimeframe] || [];

		if (timeFilter === 'today') {
			// For today, group by hour but show continuous data
			const hourGroups: { [key: string]: any[] } = {};

			data.forEach((item: any) => {
				const date = new Date(item.timestamp);
				const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`;

				if (!hourGroups[hourKey]) {
					hourGroups[hourKey] = [];
				}
				hourGroups[hourKey].push(item);
			});

			// Create data points for all hours of the day (even if no data)
			const result = [];
			for (let hour = 0; hour < 24; hour++) {
				const hourKey = `${hour.toString().padStart(2, '0')}:00`;
				const items = hourGroups[hourKey] || [];

				if (items.length > 0) {
					const avgBlinkRate =
						items.reduce((sum, item) => sum + item.blinkRate, 0) / items.length;
					const avgEyeClosure =
						items.reduce((sum, item) => sum + item.perClose, 0) / items.length;
					const avgAttention =
						items.reduce((sum, item) => sum + item.attentionFrac, 0) / items.length;
					const avgEyeAge =
						items.reduce((sum, item) => sum + (item.eyeAge || 0), 0) / items.length;

					result.push({
						time: hourKey,
						blinkRate: Math.round(avgBlinkRate),
						eyeClosure: Math.round(avgEyeClosure),
						attention: Math.round(avgAttention),
						eyeAge: Math.round(avgEyeAge),
					});
				} else {
					// Add empty data point to maintain continuity
					result.push({
						time: hourKey,
						blinkRate: 0,
						eyeClosure: 0,
						attention: 0,
						eyeAge: 0,
						noData: true,
					});
				}
			}

			return result;
		} else if (timeFilter === 'week') {
			// For week, group by day
			const dayGroups: { [key: string]: any[] } = {};
			const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

			data.forEach((item: any) => {
				const date = new Date(item.timestamp);
				const dayKey = days[date.getDay()];

				if (!dayGroups[dayKey]) {
					dayGroups[dayKey] = [];
				}
				dayGroups[dayKey].push(item);
			});

			return days.map((day) => {
				const items = dayGroups[day] || [];

				if (items.length > 0) {
					const avgBlinkRate =
						items.reduce((sum, item) => sum + item.blinkRate, 0) / items.length;
					const avgEyeClosure =
						items.reduce((sum, item) => sum + item.perClose, 0) / items.length;
					const avgAttention =
						items.reduce((sum, item) => sum + item.attentionFrac, 0) / items.length;
					const avgEyeAge =
						items.reduce((sum, item) => sum + (item.eyeAge || 0), 0) / items.length;

					return {
						time: day,
						blinkRate: Math.round(avgBlinkRate),
						eyeClosure: Math.round(avgEyeClosure),
						attention: Math.round(avgAttention),
						eyeAge: Math.round(avgEyeAge),
					};
				} else {
					return {
						time: day,
						blinkRate: 0,
						eyeClosure: 0,
						attention: 0,
						eyeAge: 0,
						noData: true,
					};
				}
			});
		} else if (timeFilter === 'month') {
			// For month, group by day
			const dayGroups: { [key: string]: any[] } = {};

			data.forEach((item: any) => {
				const date = new Date(item.timestamp);
				const dayKey = date.getDate().toString();

				if (!dayGroups[dayKey]) {
					dayGroups[dayKey] = [];
				}
				dayGroups[dayKey].push(item);
			});

			// Get number of days in current month
			const currentDate = new Date();
			const year = currentDate.getFullYear();
			const month = currentDate.getMonth();
			const daysInMonth = new Date(year, month + 1, 0).getDate();

			const result = [];
			for (let day = 1; day <= daysInMonth; day++) {
				const dayKey = day.toString();
				const items = dayGroups[dayKey] || [];

				const dateLabel = `${day}/${month + 1}`;

				if (items.length > 0) {
					const avgBlinkRate =
						items.reduce((sum, item) => sum + item.blinkRate, 0) / items.length;
					const avgEyeClosure =
						items.reduce((sum, item) => sum + item.perClose, 0) / items.length;
					const avgAttention =
						items.reduce((sum, item) => sum + item.attentionFrac, 0) / items.length;
					const avgEyeAge =
						items.reduce((sum, item) => sum + (item.eyeAge || 0), 0) / items.length;

					result.push({
						time: dateLabel,
						blinkRate: Math.round(avgBlinkRate),
						eyeClosure: Math.round(avgEyeClosure),
						attention: Math.round(avgAttention),
						eyeAge: Math.round(avgEyeAge),
					});
				} else {
					result.push({
						time: dateLabel,
						blinkRate: 0,
						eyeClosure: 0,
						attention: 0,
						eyeAge: 0,
						noData: true,
					});
				}
			}

			return result;
		} else {
			// year
			// For year, group by month
			const monthGroups: { [key: string]: any[] } = {};
			const months = [
				'Jan',
				'Feb',
				'Mar',
				'Apr',
				'May',
				'Jun',
				'Jul',
				'Aug',
				'Sep',
				'Oct',
				'Nov',
				'Dec',
			];

			data.forEach((item: any) => {
				const date = new Date(item.timestamp);
				const monthKey = months[date.getMonth()];

				if (!monthGroups[monthKey]) {
					monthGroups[monthKey] = [];
				}
				monthGroups[monthKey].push(item);
			});

			return months.map((month) => {
				const items = monthGroups[month] || [];

				if (items.length > 0) {
					const avgBlinkRate =
						items.reduce((sum, item) => sum + item.blinkRate, 0) / items.length;
					const avgEyeClosure =
						items.reduce((sum, item) => sum + item.perClose, 0) / items.length;
					const avgAttention =
						items.reduce((sum, item) => sum + item.attentionFrac, 0) / items.length;
					const avgEyeAge =
						items.reduce((sum, item) => sum + (item.eyeAge || 0), 0) / items.length;

					return {
						time: month,
						blinkRate: Math.round(avgBlinkRate),
						eyeClosure: Math.round(avgEyeClosure),
						attention: Math.round(avgAttention),
						eyeAge: Math.round(avgEyeAge),
					};
				} else {
					return {
						time: month,
						blinkRate: 0,
						eyeClosure: 0,
						attention: 0,
						eyeAge: 0,
						noData: true,
					};
				}
			});
		}
	}, [history, selectedTimeframe, timeFilter]);

	const historyData = useMemo(() => {
		const data = history[selectedTimeframe] || [];
		return data
			.filter((item: any) => {
				const matchesDate = selectedDate
					? new Date(item.timestamp).toISOString().split('T')[0] === selectedDate
					: true;
				return matchesDate;
			})
			.sort(
				(a: any, b: any) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
			);
	}, [history, selectedTimeframe, selectedDate]);

	// Memoize helper functions
	const getStatusColor = useCallback((strainText: string) => {
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
	}, []);

	const getStatusText = useCallback(
		(strainText: string) => {
			switch (strainText) {
				case 'Low':
					return reportHistoryText.statusLabels.normal;
				case 'Moderate':
					return reportHistoryText.statusLabels.blinkRate;
				case 'High':
					return reportHistoryText.statusLabels.eyeStrain;
				default:
					return reportHistoryText.statusLabels.normal;
			}
		},
		[reportHistoryText]
	);

	const getStatusType = useCallback(
		(strainText: string) => {
			switch (strainText) {
				case 'Low':
					return '';
				case 'Moderate':
					return reportHistoryText.statusTypes.blinkRate;
				case 'High':
					return reportHistoryText.statusTypes.eyeStrain;
				default:
					return '';
			}
		},
		[reportHistoryText]
	);

	const getActionText = useCallback(
		(strainText: string) => {
			return strainText === 'Low'
				? reportHistoryText.actions.quickView
				: reportHistoryText.actions.viewReport;
		},
		[reportHistoryText]
	);

	const handleViewReport = useCallback((report: any) => {
		setSelectedReport(report);
		setIsModalOpen(true);
	}, []);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			if (!selectedDate) {
				setSelectedDate(new Date().toISOString().split('T')[0]);
			}
		}
	}, [selectedDate]);

	const closeModal = useCallback(() => {
		setIsModalOpen(false);
		setSelectedReport(null);
	}, []);

	// Memoize the renderChart function
	const renderChart = useCallback(
		(title: string, dataKey: string, color: string) => {
			return (
				<BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
					<XAxis
						dataKey="time"
						tick={{ fontSize: 10 }}
						axisLine={false}
						tickLine={false}
					/>
					<YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
					<Tooltip
						content={<MemoizedCustomTooltip reportHistoryText={reportHistoryText} />}
					/>
					<Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
				</BarChart>
			);
		},
		[chartData, reportHistoryText]
	);

	// Memoize the chart components to prevent re-renders
	const blinkRateChart = useMemo(
		() => (
			<div className={styles.chartContainer}>
				<div className={styles.chartHeader}>
					<h3>{reportHistoryText.chartTitles.blinkRate}</h3>
					<div className={styles.chartStats}>
						<span className={styles.lastUpdate}>{reportHistoryText.lastUpdate}</span>
					</div>
				</div>
				<div className={styles.chart}>
					<ResponsiveContainer width="100%" height="100%">
						{renderChart(
							reportHistoryText.chartTitles.blinkRate,
							'blinkRate',
							'var(--lowValue)'
						)}
					</ResponsiveContainer>
				</div>
			</div>
		),
		[renderChart, reportHistoryText]
	);

	const eyeClosureChart = useMemo(
		() => (
			<div className={styles.chartContainer}>
				<div className={styles.chartHeader}>
					<h3>{reportHistoryText.chartTitles.eyeClosure}</h3>
					<div className={styles.chartStats}>
						<span className={styles.lastUpdate}>{reportHistoryText.lastUpdate}</span>
					</div>
				</div>

				<div className={styles.chart}>
					<ResponsiveContainer width="100%" height="100%">
						{renderChart(
							reportHistoryText.chartTitles.eyeClosure,
							'eyeClosure',
							'var(--modValue)'
						)}
					</ResponsiveContainer>
				</div>
			</div>
		),
		[renderChart, reportHistoryText]
	);

	const attentionChart = useMemo(
		() => (
			<div className={styles.chartContainer}>
				<div className={styles.chartHeader}>
					<h3>{reportHistoryText.chartTitles.attention}</h3>
					<div className={styles.chartStats}>
						<span className={styles.lastUpdate}>{reportHistoryText.lastUpdate}</span>
					</div>
				</div>

				<div className={styles.chart}>
					<ResponsiveContainer width="100%" height="100%">
						{renderChart(
							reportHistoryText.chartTitles.attention,
							'attention',
							'var(--lightMetricValue)'
						)}
					</ResponsiveContainer>
				</div>
			</div>
		),
		[renderChart, reportHistoryText]
	);

	const eyeAgeChart = useMemo(
		() => (
			<div className={styles.chartContainer}>
				<div className={styles.chartHeader}>
					<h3>{reportHistoryText.chartTitles.eyeAge}</h3>

					<span className={styles.lastUpdate}>{reportHistoryText.lastUpdate}</span>
				</div>

				<div className={styles.chart}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={chartData} margin={{ top: 5, bottom: 5 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
							<XAxis
								dataKey="time"
								tick={{ fontSize: 10 }}
								axisLine={false}
								tickLine={false}
							/>
							<YAxis
								tick={{ fontSize: 10 }}
								axisLine={false}
								tickLine={false}
								width={30}
							/>
							<Tooltip
								content={
									<MemoizedCustomTooltip reportHistoryText={reportHistoryText} />
								}
							/>
							<Bar dataKey="eyeAge" radius={[4, 4, 0, 0]}>
								{chartData.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={
											entry.eyeAge > 50
												? 'var(--vHighValue)'
												: entry.eyeAge > 40
													? 'var(--highValue)'
													: 'var(--lowValue)'
										}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>
		),
		[chartData, reportHistoryText]
	);

	// Memoize the table rows to prevent re-renders
	const tableRows = useMemo(() => {
		if (historyData.length === 0) return null;

		return historyData.map((report: any, index: number) => {
			const date = new Date(report.timestamp);
			const formattedDate = date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: '2-digit',
			});
			const formattedTime = date.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
			});
			return (
				<div key={index} className={styles.tableRow}>
					<div className={styles.dateColumn}>
						<p>{formattedDate}</p>
						<p className={styles.time}>{formattedTime}</p>
					</div>
					<div className={styles.resultColumn}>
						<span className={`${styles.status} ${getStatusColor(report.strainText)}`}>
							{getStatusText(report.strainText)}
						</span>
						{report.strainText !== 'Low' && (
							<span className={styles.statusType}>
								{getStatusType(report.strainText)}
							</span>
						)}
					</div>
					<button
						className={styles.actionButton}
						onClick={() => handleViewReport(report)}
					>
						<Eye size={14} />
						{getActionText(report.strainText)}
					</button>
				</div>
			);
		});
	}, [
		historyData,
		getStatusColor,
		getStatusText,
		getStatusType,
		getActionText,
		handleViewReport,
	]);

	return (
		<div className={styles.reportHistory}>
			<div className={styles.header}>
				<TitleHeader title={dashboardPageText.eyeScanReportTitle} />

				{/* <div className={styles.dateSelector}>
					<Calendar size={14} />
					<span>
						{selectedDate
							? new Date(selectedDate).toLocaleDateString('en-US', {
									weekday: 'short',
									year: 'numeric',
									month: 'short',
									day: 'numeric',
								})
							: 'Select date'}
					</span>
					<ChevronDown size={14} />
				</div> */}
			</div>

			<div className={styles.container}>
				<div className={styles.controlsContainer}>
					<div className={styles.filterBadges}>
						<button
							className={`${styles.filterBadge} ${timeFilter === 'today' ? styles.active : ''}`}
							onClick={() => setTimeFilter('today')}
						>
							{reportHistoryText.timeFilters.today}
						</button>
						<button
							className={`${styles.filterBadge} ${timeFilter === 'week' ? styles.active : ''}`}
							onClick={() => setTimeFilter('week')}
						>
							{reportHistoryText.timeFilters.week}
						</button>
						<button
							className={`${styles.filterBadge} ${timeFilter === 'month' ? styles.active : ''}`}
							onClick={() => setTimeFilter('month')}
						>
							{reportHistoryText.timeFilters.month}
						</button>
						<button
							className={`${styles.filterBadge} ${timeFilter === 'year' ? styles.active : ''}`}
							onClick={() => setTimeFilter('year')}
						>
							{reportHistoryText.timeFilters.year}
						</button>
					</div>
					<div className={styles.viewButtons}>
						<button
							className={`${styles.viewButton} ${viewMode === 'chart' ? styles.active : ''}`}
							onClick={() => setViewMode('chart')}
							title={reportHistoryText.viewModes.chartView}
						>
							<BarChart3 size={16} />
							{reportHistoryText.viewModes.chart}
						</button>
						<button
							className={`${styles.viewButton} ${viewMode === 'table' ? styles.active : ''}`}
							onClick={() => setViewMode('table')}
							title={reportHistoryText.viewModes.tableView}
						>
							<Table size={16} />
							{reportHistoryText.viewModes.table}
						</button>
					</div>
				</div>

				{viewMode === 'chart' ? (
					<div className={styles.chartsGrid}>
						{blinkRateChart}
						{eyeClosureChart}
						{attentionChart}
						{eyeAgeChart}
					</div>
				) : (
					<div className={styles.tableContainer}>
						<div className={styles.tableHeader}>
							<span>{reportHistoryText.tableHeaders.date}</span>
							<span>{reportHistoryText.tableHeaders.results}</span>
							<span>{reportHistoryText.tableHeaders.actions}</span>
						</div>
						{historyData.length > 0 ? (
							tableRows
						) : (
							<div className={styles.emptyState}>
								<Clock size={48} />
								<p>
									{reportHistoryText.emptyState.noHistory}{' '}
									{selectedDate || reportHistoryText.emptyState.selectedDate}
								</p>
								<p>{reportHistoryText.emptyState.startTracking}</p>
							</div>
						)}
					</div>
				)}
			</div>

			<ModalView
				isModalOpen={isModalOpen}
				closeModal={closeModal}
				selectedReport={selectedReport}
				getStatusColor={getStatusColor}
				getStatusText={getStatusText}
			/>
		</div>
	);
}

export default ReportHistory;
