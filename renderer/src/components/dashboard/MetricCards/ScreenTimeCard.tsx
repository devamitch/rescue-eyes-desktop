'use client';

import useTranslationData from '@/hooks/use-translation-data';
import { MetricsCardData } from '@/types';
import React from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import Styles from './MetricsCard.module.css';
import CustomTooltip from './Tooltip';

const ScreenTimeCard: React.FC<{ data: MetricsCardData; metrics: any }> = ({ data, metrics }) => {
	const { metricCardsText } = useTranslationData();

	const formatHourTick = (hour: number) => {
		if (hour === 0) return '12AM';
		if (hour === 12) return '12PM';
		if (hour < 12) return `${hour}AM`;
		return `${hour - 12}PM`;
	};

	const shouldDisplayTick = (index: number) => {
		return index % 3 === 0;
	};

	return (
		<div className={Styles.card}>
			<div className={Styles.contentSection}>
				<div className={Styles.header}>
					<span className={Styles.name}>{data.name}</span>
				
					<span className={Styles.icon}>{data.icon}</span>
				</div>
				<div className={Styles.valueContainer}>
					<span className={Styles.value}>{data.value}</span>
					{data.unit && <span className={Styles.unit}>{data.unit}</span>}
				</div>
				<div className={Styles.status} data-status={data.status}>
					{data.status === 'high'
						? metricCardsText.highUsage
						: metricCardsText.defaultStatus}
				</div>
			</div>

			<div className={Styles.chartSection}>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={data.graphData}
						margin={{ top: 5, right: 5, left: 5, bottom: 15 }}
					>
						<Bar dataKey="v" fill="#c4b5fd" radius={[4, 4, 0, 0]} width={15}>
							{data.graphData.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={entry.high ? '#8b5cf6' : '#c4b5fd'}
								/>
							))}
						</Bar>
						<Tooltip
							content={
								<CustomTooltip
									valueSuffix=" min"
									chartType="screentime"
									labelFormatter={(data) => {
										const hour = data.hour;
										const period = hour >= 12 ? 'PM' : 'AM';
										const displayHour = hour % 12 || 12;
										return `${displayHour} ${period}`;
									}}
								/>
							}
							position={{ y: 0 }}
						/>
						<XAxis
							dataKey="hour"
							axisLine={false}
							tickLine={false}
							tickFormatter={formatHourTick}
							tick={{ fontSize: 10, fill: 'rgba(146, 162, 156, 1)' }}
							interval={0}
							tickCount={8}
							ticks={[0, 3, 6, 9, 12, 15, 18, 21]}
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default ScreenTimeCard;
