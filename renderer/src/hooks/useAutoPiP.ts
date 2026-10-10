import { useCallback, useEffect, useRef } from 'react';

interface UseAutoPiPProps {
	isActive: boolean;
	isInPiPMode: boolean;
	isAutoPiP: boolean;
	enterPiP: (isAutomatic: boolean) => Promise<boolean>;
	exitPiP: () => Promise<boolean>;
	enabled?: boolean;
}

export const useAutoPiP = ({
	isActive,
	isInPiPMode,
	isAutoPiP,
	enterPiP,
	exitPiP,
	enabled = true,
}: UseAutoPiPProps) => {
	const isCurrentlyActiveRef = useRef(true);
	const isProcessingRef = useRef(false);
	const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
	const animationFrameIdRef = useRef<number | null>(null);

	const checkActivity = useCallback(async () => {
		if (isProcessingRef.current || !enabled) return;

		const isNowActive = document.hasFocus() && !document.hidden;

		// Website became inactive - enter PiP
		if (isCurrentlyActiveRef.current && !isNowActive && !isInPiPMode && isActive) {
			console.log('Auto-PiP: Website inactive, entering PiP');
			isProcessingRef.current = true;
			try {
				await enterPiP(true);
			} catch (error) {
				console.error('Auto-PiP: Failed to enter PiP:', error);
			} finally {
				isProcessingRef.current = false;
			}
		}
		// Website became active - exit PiP if it was auto-activated
		else if (!isCurrentlyActiveRef.current && isNowActive && isAutoPiP && isInPiPMode) {
			console.log('Auto-PiP: Website active, exiting auto PiP');
			isProcessingRef.current = true;
			try {
				await exitPiP();
			} catch (error) {
				console.error('Auto-PiP: Failed to exit PiP:', error);
			} finally {
				isProcessingRef.current = false;
			}
		}

		isCurrentlyActiveRef.current = isNowActive;
	}, [isActive, isInPiPMode, isAutoPiP, enterPiP, exitPiP, enabled]);

	useEffect(() => {
		if (!isActive || !enabled) {
			// Cleanup if disabled
			if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
			if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
			return;
		}

		const handleActivityChange = () => {
			// Cancel pending operations
			if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
			if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);

			// Debounce activity checks to prevent rapid toggling
			timeoutIdRef.current = setTimeout(() => {
				animationFrameIdRef.current = requestAnimationFrame(checkActivity);
			}, 200);
		};

		// Initial state
		isCurrentlyActiveRef.current = document.hasFocus() && !document.hidden;

		// Add event listeners
		document.addEventListener('visibilitychange', handleActivityChange);
		window.addEventListener('blur', handleActivityChange);
		window.addEventListener('focus', handleActivityChange);
		window.addEventListener('resize', handleActivityChange);

		// Initial check after mount
		const initialCheckTimeout = setTimeout(() => {
			checkActivity();
		}, 1000);

		return () => {
			// Cleanup all timeouts and listeners
			if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
			if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
			clearTimeout(initialCheckTimeout);

			document.removeEventListener('visibilitychange', handleActivityChange);
			window.removeEventListener('blur', handleActivityChange);
			window.removeEventListener('focus', handleActivityChange);
			window.removeEventListener('resize', handleActivityChange);
		};
	}, [isActive, enabled, checkActivity]);

	// Debug effect
	useEffect(() => {
		console.log('Auto-PiP State:', {
			isActive,
			isInPiPMode,
			isAutoPiP,
			enabled,
			isProcessing: isProcessingRef.current,
		});
	}, [isActive, isInPiPMode, isAutoPiP, enabled]);
};
