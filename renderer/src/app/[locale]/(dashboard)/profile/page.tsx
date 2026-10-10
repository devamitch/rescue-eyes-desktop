'use client';
import ExerciseCard from '@/components/icare/ExerciseCard/ExerciseCard';
import TitleHeader from '@/components/layout/Title/TitleHeader';
import ProfileCard from '@/components/profile/profileCard/ProfileCard';
import RecentScan from '@/components/profile/RecentScan/RecentScan';
import useTranslationData from '@/hooks/use-translation-data';
import { EyeMetrics } from '@/hooks/useEyeTracking';
import { Link, useRouter } from '@/i18n/navigation';
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import { useCallback, useMemo, useState } from 'react';
import styles from './ProfilePage.module.css';
import { useAuth } from '@/provider/AuthUserContext';
import { auth } from '@/constants/firebase';
import { LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import ExerciseModal from '@/components/icare/ExerciseModal/ExerciseModal';
import { ExerciseCardData } from '@/types';

export default function ProfilePage() {
	const { authUser } = useAuth();
		const [selectedExercise, setSelectedExercise] = useState<ExerciseCardData | null>(null);
		const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
	
	const { ExerciseData, mockReportBrief, profilePageText, userData } = useTranslationData();
	const { getMetricsHistory } = useEyeTrackingContext();
		const { settingsPageText } = useTranslationData();
			const { metrics } = useEyeTrackingContext();
		const router = useRouter();
	
		const handleLogout = async () => {
			try {
				await signOut(auth);
				router.push('/signin');
			} catch (error) {
				console.error('Error signing out: ', error);
			}
		};

	const DefaultchartData=  [
			{ v: 15, high: false },
			{ v: 20, high: true },
			{ v: 18, high: false },
			{ v: 28, high: true },
			{ v: 12, high: false },
			{ v: 22, high: true },
			{ v: 10, high: false }
		]

	const generateChartData = useCallback((history: EyeMetrics[]) => {
		if (!history || history.length === 0) {
			return  DefaultchartData;
		}

		const recentData = history.slice(-7);
		return recentData.map((metric) => ({
			v: Math.round(metric.blinkRate || 15),
			high: (metric.blinkRate || 15) > 20 || metric.strainLevelIdx > 1,
		}));
	}, [DefaultchartData]);

	const metricsHistory = useMemo(() => getMetricsHistory() || [], [getMetricsHistory]);
	const chartData = useMemo(() => generateChartData(metricsHistory), [generateChartData, metricsHistory]);
	
	const handleExerciseClick = (exercise: ExerciseCardData) => {
		setSelectedExercise(exercise);
		setIsExerciseModalOpen(true);
	};

	const handleCloseExerciseModal = () => {
		setIsExerciseModalOpen(false);
		setSelectedExercise(null);
	};


	return (
		<div className={styles.container}>
			<ProfileCard
				name={authUser?.displayName || userData.name}
				email={authUser?.email || userData.email}
				image={authUser?.photoURL || userData.image}
			/>
			<>
				<TitleHeader title={profilePageText.sectionTitles.recentEyeScan} />
				<RecentScan report={mockReportBrief} chartData={chartData} />
			</>
			<>
				<TitleHeader title={profilePageText.sectionTitles.scanHistory} />
				<Link href="/dashboard" className={styles.Historysection}>
					<h2 className={styles.title}>{profilePageText.scanHistory.title}</h2>
					<p className={styles.description}>{profilePageText.scanHistory.description}</p>
				</Link>
			</>
			<>
				<TitleHeader title={profilePageText.sectionTitles.personalisedAdvice} />
				<div className={styles.mainSection}>
					{ExerciseData.map((exercise) => (
						<ExerciseCard
							key={exercise.title}
							title={exercise.title}
							image={exercise.image}
							youtubeUrl={exercise.youtubeUrl}
							description={exercise.description}
							onClick={() => handleExerciseClick(exercise)}
						/>
					))}
				</div>
			</>
							<div className={styles.Historysection}>
					 <button onClick={handleLogout} className={styles.Logoutbutton}>
						<LogOut size={21} />
						{settingsPageText.logOut}
					</button>
				</div>

					<ExerciseModal
				isOpen={isExerciseModalOpen}
				onClose={handleCloseExerciseModal}
				exercise={selectedExercise}
				currentMetrics={metrics}
			/>
		</div>
	);
}