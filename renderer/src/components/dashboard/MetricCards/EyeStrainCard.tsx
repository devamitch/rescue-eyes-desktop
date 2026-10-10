'use client';

import useTranslationData from '@/hooks/use-translation-data';
import { MetricsCardData } from '@/types';
import React from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Styles from './MetricsCard.module.css';
import CustomTooltip from './Tooltip';

const EyeStrainCard: React.FC<{ data: MetricsCardData; metrics: any }> = ({ data, metrics }) => {
	const { metricCardsText } = useTranslationData();
	const strainLevels = metricCardsText.strainLevels;

	return (
		<div className={Styles.card}>
			<div className={Styles.contentSection}>
				<div className={Styles.header}>
					<span className={Styles.name}>{data.name}</span>
					<span className={Styles.icon}>{data.icon}</span>
				</div>
				<div className={Styles.valueContainer}>
					<span className={Styles.value}>{data.value}</span>
					{/* {data.unit && <span className={Styles.unit}>{data.unit}</span>} */}
				</div>
				<div className={Styles.status} data-status={data.status}>
					{metrics?.strainText || metricCardsText.defaultStatus}
				</div>
			</div>

			<div className={Styles.chartSection}>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={data.graphData}
						margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
					>
						<Bar dataKey="v" radius={[4, 4, 0, 0]}>
							{data.graphData.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={entry.high ? '#A74444' : '#C2665A'}
								/>
							))}
						</Bar>
						<Tooltip
							content={
								<CustomTooltip
									chartType="strain"
									valueFormatter={(value) => strainLevels[value] || 'Unknown'}
								/>
							}
							position={{ y: 0 }}
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default EyeStrainCard;
