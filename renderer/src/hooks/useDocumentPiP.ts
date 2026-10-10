import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseDocumentPiPProps {
	videoRef: React.RefObject<HTMLVideoElement>;
	canvasRef: React.RefObject<HTMLCanvasElement>;
	isActive: boolean;
	onPiPChange?: (isInPiP: boolean) => void;
}

interface UseDocumentPiPReturn {
	isInPiPMode: boolean;
	isAutoPiP: boolean;
	isPiPSupported: boolean;
	enterPiP: (isAutomatic?: boolean) => Promise<boolean>;
	exitPiP: () => Promise<boolean>;
	togglePiP: () => Promise<void>;
}

export const useDocumentPiP = ({
	videoRef,
	canvasRef,
	isActive,
	onPiPChange,
}: UseDocumentPiPProps): UseDocumentPiPReturn => {
	const [isInPiPMode, setIsInPiPMode] = useState(false);
	const [isAutoPiP, setIsAutoPiP] = useState(false);
	const [isPiPSupported, setIsPiPSupported] = useState(false);

	const pipWindowRef = useRef<Window | null>(null);
	const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const pipVideoRef = useRef<HTMLVideoElement | null>(null);
	const animationFrameRef = useRef<number>(0);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const isDocumentPiPRef = useRef(false);
	const lastCanvasUpdateRef = useRef<number>(0);

	// Memoized PiP support check
	const pipSupportInfo = useMemo(() => {
		const video = document.createElement('video');
		const isStandardPiP = !!(video.requestPictureInPicture && document.pictureInPictureEnabled);
		const isDocPiP = !!window.documentPictureInPicture;

		return {
			isSupported: isStandardPiP || isDocPiP,
			isDocumentPiP: isDocPiP,
			isStandardPiP: isStandardPiP,
		};
	}, []);

	// Initialize PiP support
	useEffect(() => {
		setIsPiPSupported(pipSupportInfo.isSupported);
		isDocumentPiPRef.current = pipSupportInfo.isDocumentPiP;
	}, [pipSupportInfo]);

	// Store media stream reference with stable callback
	const updateMediaStream = useCallback(() => {
		const video = videoRef.current;
		if (video?.srcObject) {
			mediaStreamRef.current = video.srcObject as MediaStream;
		}
	}, [videoRef]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		video.addEventListener('loadedmetadata', updateMediaStream);
		updateMediaStream(); // Initial check

		return () => {
			video.removeEventListener('loadedmetadata', updateMediaStream);
		};
	}, [videoRef, updateMediaStream]);

	// Optimized canvas copying with frame limiting
	const copyCanvasToPiP = useCallback(() => {
		if (!pipCanvasRef.current || !canvasRef.current || !isActive) {
			cancelAnimationFrame(animationFrameRef.current);
			return;
		}

		const sourceCanvas = canvasRef.current;
		const targetCanvas = pipCanvasRef.current;

		// Performance optimization: Skip if no content
		if (sourceCanvas.width === 0 || sourceCanvas.height === 0) {
			animationFrameRef.current = requestAnimationFrame(copyCanvasToPiP);
			return;
		}

		// Frame rate limiting (max 30fps)
		const now = performance.now();
		if (now - lastCanvasUpdateRef.current < 33) {
			// ~30fps
			animationFrameRef.current = requestAnimationFrame(copyCanvasToPiP);
			return;
		}

		// Resize only when necessary
		if (
			targetCanvas.width !== sourceCanvas.width ||
			targetCanvas.height !== sourceCanvas.height
		) {
			targetCanvas.width = sourceCanvas.width;
			targetCanvas.height = sourceCanvas.height;
		}

		const ctx = targetCanvas.getContext('2d');
		if (ctx) {
			ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
			ctx.drawImage(sourceCanvas, 0, 0);
			lastCanvasUpdateRef.current = now;
		}

		// Continue only if still in PiP mode
		if (isInPiPMode) {
			animationFrameRef.current = requestAnimationFrame(copyCanvasToPiP);
		}
	}, [canvasRef, isActive, isInPiPMode]);

	// Cleanup function with stable reference
	const cleanupPiP = useCallback(() => {
		console.log('Cleaning up PiP resources');

		cancelAnimationFrame(animationFrameRef.current);
		animationFrameRef.current = 0;

		if (pipWindowRef.current && !pipWindowRef.current.closed) {
			pipWindowRef.current.close();
		}

		// Clean up media streams
		if (pipVideoRef.current) {
			pipVideoRef.current.srcObject = null;
			pipVideoRef.current = null;
		}

		pipWindowRef.current = null;
		pipCanvasRef.current = null;

		setIsInPiPMode(false);
		setIsAutoPiP(false);
	}, []);

	// Exit PiP mode
	const exitPiP = useCallback(async (): Promise<boolean> => {
		try {
			console.log('Exiting PiP mode');

			// Handle standard PiP API first
			if (document.pictureInPictureElement && videoRef.current) {
				await document.exitPictureInPicture();
			}

			// Then cleanup Document PiP
			cleanupPiP();

			onPiPChange?.(false);
			return true;
		} catch (error) {
			console.error('Failed to exit PiP mode:', error);
			// Force cleanup on error
			cleanupPiP();
			return false;
		}
	}, [cleanupPiP, onPiPChange, videoRef]);

	// Create Document PiP window
	const createDocumentPiPWindow = useCallback(async (): Promise<boolean> => {
		if (!window.documentPictureInPicture || !mediaStreamRef.current) {
			return false;
		}

		try {
			console.log('Creating Document PiP window');

			const pipWindow = await window.documentPictureInPicture.requestWindow({
				width: 400,
				height: 300,
			});

			pipWindowRef.current = pipWindow;

			// Add optimized styles
			const style = document.createElement('style');
			style.textContent = `
        * {
          box-sizing: border-box;
        }
        body { 
          margin: 0; 
          padding: 0; 
          overflow: hidden; 
          background: #000; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          user-select: none;
          -webkit-user-select: none;
        }
        .pip-container { 
          width: 100vw; 
          height: 100vh; 
          position: relative; 
          overflow: hidden; 
          background: #000;
        }
        .pip-video { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          transform: scaleX(-1);
          background: #000;
        }
        .pip-canvas { 
          position: absolute; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          transform: scaleX(-1); 
          pointer-events: none; 
          z-index: 10;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
        .pip-controls {
          position: absolute; 
          bottom: 16px; 
          left: 50%; 
          transform: translateX(-50%);
          display: flex; 
          gap: 12px; 
          z-index: 20; 
          opacity: 0; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 8px 16px;
          border-radius: 24px;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
        }
        .pip-container:hover .pip-controls {
          opacity: 1;
        }
        .pip-controls button {
          width: 36px; 
          height: 36px; 
          border: none; 
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1); 
          color: white; 
          cursor: pointer;
          display: flex; 
          align-items: center; 
          justify-content: center;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .pip-controls button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }
        .pip-controls button:active {
          transform: scale(0.95);
        }
        .pip-status {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 15;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          backdrop-filter: blur(10px);
        }
      `;
			pipWindow.document.head.appendChild(style);

			// Create container
			const container = document.createElement('div');
			container.className = 'pip-container';

			// Create video element
			const videoClone = document.createElement('video');
			videoClone.className = 'pip-video';
			videoClone.autoplay = true;
			videoClone.playsInline = true;
			videoClone.muted = true;
			videoClone.srcObject = mediaStreamRef.current;

			pipVideoRef.current = videoClone;

			// Create canvas with proper dimensions
			const canvasClone = document.createElement('canvas');
			canvasClone.className = 'pip-canvas';

			if (canvasRef.current) {
				canvasClone.width = canvasRef.current.width || 640;
				canvasClone.height = canvasRef.current.height || 480;
			} else {
				canvasClone.width = 640;
				canvasClone.height = 480;
			}

			pipCanvasRef.current = canvasClone;

			// Create status indicator
			const statusIndicator = document.createElement('div');
			statusIndicator.className = 'pip-status';
			statusIndicator.textContent = 'Eye Tracking Active';

			// Create controls
			const controlsContainer = document.createElement('div');
			controlsContainer.className = 'pip-controls';

			const exitButton = document.createElement('button');
			exitButton.innerHTML = '✕';
			exitButton.title = 'Exit PiP';
			exitButton.addEventListener('click', () => exitPiP());

			controlsContainer.appendChild(exitButton);
			container.appendChild(videoClone);
			container.appendChild(canvasClone);
			container.appendChild(statusIndicator);
			pipWindow.document.body.appendChild(container);
			pipWindow.document.body.appendChild(controlsContainer);

			// Enhanced event listeners
			const handleWindowClose = () => {
				console.log('PiP window closed');
				cleanupPiP();
			};

			pipWindow.addEventListener('pagehide', handleWindowClose);
			pipWindow.addEventListener('beforeunload', handleWindowClose);

			// Start video and canvas copying
			try {
				await videoClone.play();
				console.log('PiP video started playing');
			} catch (playError) {
				console.error('Failed to play PiP video:', playError);
			}

			// Start canvas animation loop
			animationFrameRef.current = requestAnimationFrame(copyCanvasToPiP);

			return true;
		} catch (error) {
			console.error('Failed to create Document PiP window:', error);
			cleanupPiP();
			return false;
		}
	}, [canvasRef, cleanupPiP, copyCanvasToPiP, exitPiP]);

	// Enter PiP mode
	const enterPiP = useCallback(
		async (isAutomatic = false): Promise<boolean> => {
			if (!isPiPSupported || !videoRef.current || isInPiPMode || !isActive) {
				console.log('PiP conditions not met:', {
					isPiPSupported,
					hasVideo: !!videoRef.current,
					isInPiPMode,
					isActive,
				});
				return false;
			}

			try {
				let success = false;

				// Prefer Document PiP API
				if (isDocumentPiPRef.current) {
					success = await createDocumentPiPWindow();
				}
				// Fallback to standard PiP
				else if (videoRef.current.requestPictureInPicture) {
					console.log('Using standard PiP API');
					await videoRef.current.requestPictureInPicture();
					success = true;
				}

				if (success) {
					console.log('Successfully entered PiP mode, automatic:', isAutomatic);
					setIsInPiPMode(true);
					setIsAutoPiP(isAutomatic);
					onPiPChange?.(true);
				}

				return success;
			} catch (error) {
				console.error('Failed to enter PiP mode:', error);
				return false;
			}
		},
		[isPiPSupported, videoRef, isInPiPMode, isActive, createDocumentPiPWindow, onPiPChange]
	);

	// Toggle PiP with error handling
	const togglePiP = useCallback(async () => {
		try {
			if (isInPiPMode) {
				await exitPiP();
			} else {
				// await enterPiP(false);
			}
		} catch (error) {
			console.error('Failed to toggle PiP:', error);
		}
	}, [isInPiPMode, exitPiP]);

	// Handle standard PiP events
	useEffect(() => {
		const video = videoRef.current;
		if (!video || isDocumentPiPRef.current) return;

		const handleEnterPiP = () => {
			console.log('Entered standard PiP mode');
			setIsInPiPMode(true);
			// onPiPChange?.(true);
		};

		const handleLeavePiP = () => {
			console.log('Left standard PiP mode');
			cleanupPiP();
			onPiPChange?.(false);
		};

		video.addEventListener('enterpictureinpicture', handleEnterPiP);
		video.addEventListener('leavepictureinpicture', handleLeavePiP);

		return () => {
			video.removeEventListener('enterpictureinpicture', handleEnterPiP);
			video.removeEventListener('leavepictureinpicture', handleLeavePiP);
		};
	}, [videoRef, cleanupPiP, onPiPChange]);

	// Auto-cleanup on unmount
	useEffect(() => {
		return () => {
			console.log('PiP hook unmounting, cleaning up...');
			cleanupPiP();
		};
	}, [cleanupPiP]);

	// Debug effect to track re-renders
	useEffect(() => {
		console.log('PiP State Update:', {
			isInPiPMode,
			isAutoPiP,
			isPiPSupported,
			isActive,
		});
	}, [isInPiPMode, isAutoPiP, isPiPSupported, isActive]);

	return {
		isInPiPMode,
		isAutoPiP,
		isPiPSupported,
		enterPiP,
		exitPiP,
		togglePiP,
	};
};
