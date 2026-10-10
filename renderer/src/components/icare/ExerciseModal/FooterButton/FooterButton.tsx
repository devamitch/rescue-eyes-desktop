import useTranslationData from '@/hooks/use-translation-data';
import { CheckCircle, RotateCcw } from 'lucide-react';
import styles from './footerbutton.module.css';

const FooterButton = ({
	videoEnded,
	handleExerciseComplete,
	handleRestartExercise,
}: {
	videoEnded: boolean;
	handleExerciseComplete: () => void;
	handleRestartExercise: () => void;
}) => {
	const { exerciseModalText } = useTranslationData();

	return (
		<div className={styles.exerciseButton}>
			{!videoEnded ? (
				<button onClick={handleExerciseComplete} className={styles.completeButton}>
					<CheckCircle size={20} />
					{exerciseModalText.buttons.markComplete}
				</button>
			) : (
				<button onClick={handleRestartExercise} className={styles.restartButton}>
					<RotateCcw size={20} />
					{exerciseModalText.buttons.restart}
				</button>
			)}
		</div>
	);
};

export default FooterButton;
