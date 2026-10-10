import { X } from 'lucide-react';
import styles from './picturein.module.scss';

interface FullScreenCloseProps {
	isFullScreen: boolean;
	onClose: () => void;
}

export const FullScreenClose = ({ isFullScreen, onClose }: FullScreenCloseProps) => {
	if (!isFullScreen) return null;

	return (
		<button className={styles.closeButton} onClick={onClose} title="Exit Fullscreen">
			<X size={20} />
		</button>
	);
};
