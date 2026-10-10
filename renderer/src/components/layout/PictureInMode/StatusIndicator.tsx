// StatusIndicator.tsx
import styles from './picturein.module.scss';

interface StatusIndicatorProps {
	isActive: boolean;
	isExpanded: boolean;
	isFullScreen: boolean;
	isInPiPMode: boolean;
	isAutoPiP?: boolean;
}

export const StatusIndicator = ({
	isActive,
	isExpanded,
	isFullScreen,
	isInPiPMode,
	isAutoPiP = false,
}: StatusIndicatorProps) => {
	return (
		<div className={styles.statusIndicator}>
			<div
				className={`${styles.statusDot} ${isActive ? styles.active : ''} ${isInPiPMode ? styles.pipMode : ''}`}
			/>
			{(isExpanded || isFullScreen) && (
				<span className={styles.statusText}>
					{isActive ? 'Tracking' : 'Paused'}
					{isInPiPMode && ` • ${isAutoPiP ? 'Auto PiP' : 'PiP'}`}
				</span>
			)}
		</div>
	);
};
