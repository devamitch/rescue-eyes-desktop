import { Eye, Scan } from 'lucide-react';
import React from 'react';
import styles from './EyeScanButton.module.css';

interface EyeScanButtonProps {
	onClick: () => void;
	disabled?: boolean;
}

const EyeScanButton: React.FC<EyeScanButtonProps> = ({ onClick, disabled = false }) => {
	return (
		<button 
			className={styles.scanButton} 
			onClick={onClick} 
			disabled={disabled}
			aria-label="Start Eye Scan"
		>
			<div className={styles.iconContainer}>
				<Eye className={styles.eyeIcon} size={24} />
				<Scan className={styles.scanIcon} size={16} />
			</div>
			<div className={styles.textContainer}>
				<h3 className={styles.title}>Get an Eye Scan</h3>
				<p className={styles.subtitle}>Quick 30-second assessment</p>
			</div>
			<div className={styles.arrow}>→</div>
		</button>
	);
};

export default EyeScanButton;