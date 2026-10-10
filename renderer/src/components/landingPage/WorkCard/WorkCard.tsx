import useTranslationData from '@/hooks/use-translation-data';
import { Link } from '@/i18n/navigation';
import styles from './WorkCard.module.css';

function WorkCard() {
	const { workCardText } = useTranslationData();
	return (
		<div className={styles.card}>
			<div className={styles.headerContainer}>
				<h2 className={styles.headerTitle}>{workCardText.headerTitle}</h2>
			</div>

			<div className={styles.grid}>
				{workCardText.steps.map((step, index) => (
					<div key={index} className={styles.stepContainer}>
						<div className={styles.stepNumber}>{step.number}</div>
						<h3 className={styles.stepTitle}>{step.title}</h3>
						<p className={styles.stepDescription}>{step.description}</p>
					</div>
				))}
			</div>

			<div className={styles.buttonContainer}>
				<Link href="/register">
					<button className={styles.Signinbutton}>{workCardText.buttonText}</button>
				</Link>
			</div>
		</div>
	);
}

export default WorkCard;
