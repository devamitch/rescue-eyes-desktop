'use client';
import useTranslationData from '@/hooks/use-translation-data';
import { RecentScanProps } from '@/types';
import { useLocale } from 'next-intl';
import { Bar, BarChart, Cell, ResponsiveContainer } from 'recharts';
import styles from './RecentScan.module.css';
import Link from 'next/link';

function RecentScan({ report, chartData }: RecentScanProps) {
	const { profilePageText } = useTranslationData();
	const locale = useLocale();

	return (
		<div className={styles.container}>
			<div className={styles.textSection}>
				<h2 className={styles.title}>{profilePageText.recentScan.title}</h2>
				<p className={styles.subtitle}>
					{profilePageText.recentScan.confidenceLabel} {report.confidenceAverage}
				</p>
				<p className={styles.subtitle}>{report.condition}</p>
				<Link href="#" className={styles.link}>
					{profilePageText.recentScan.viewFullReport}
				</Link>
			</div>
			<div>
				<p className={styles.subtitle}>{report.date}</p>
				<div className={styles.chartSection}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={chartData}
							barGap={2}
							margin={{ top: 10, right: 5, left: 5, bottom: 5 }}
						>
							<Bar dataKey="v" radius={[4, 4, 0, 0]}>
								{chartData.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={entry.high ? '#f87171' : '#fda4af'}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
}

export default RecentScan;
