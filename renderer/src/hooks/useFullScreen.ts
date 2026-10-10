import { usePiP } from '@/provider/PiPContext';
import { useEffect } from 'react';

export const useFullScreen = () => {
	const { setIsFullScreen } = usePiP();

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullScreen(document.fullscreenElement !== null);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	}, [setIsFullScreen]);

	const toggleFullScreen = async (element: HTMLElement | null) => {
		if (!element) return;

		try {
			if (document.fullscreenElement) {
				await document.exitFullscreen();
			} else {
				await element.requestFullscreen();
			}
		} catch (err) {
			console.error('Fullscreen error:', err);
		}
	};

	return { toggleFullScreen };
};
