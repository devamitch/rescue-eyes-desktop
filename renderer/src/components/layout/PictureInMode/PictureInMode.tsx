'use client';

import { useFullScreen } from '@/hooks/useFullScreen';
import { usePiPState } from '@/hooks/usePiPState';
import { useVideoSync } from '@/hooks/useVideoSync';
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import { usePiP } from '@/provider/PiPContext';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ControlButtons } from './ControlButtons';
import { FullScreenClose } from './FullScreenClose';
import { StatusIndicator } from './StatusIndicator';

import { useParams } from 'next/navigation';
import styles from './picturein.module.scss';

// Type definitions for extended PiP APIs
interface DocumentPictureInPicture {
	requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
	readonly window: Window | null;
}

declare global {
	interface Window {
		documentPictureInPicture?: DocumentPictureInPicture;
		wakeLock?: any;
	}
}

const isLivePage = false;

// Custom hook for page visibility
const usePageVisibility = () => {
	const [isVisible, setIsVisible] = useState(!document.hidden);

	useEffect(() => {
		const handleVisibilityChange = () => {
			setIsVisible(!document.hidden);
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

	return isVisible;
};

// Custom hook for background tracking
const useBackgroundTracking = () => {
	const wakeLockRef = useRef<any>(null);
	const mediaKeepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const acquireWakeLock = useCallback(async () => {
		if ('wakeLock' in navigator) {
			try {
				wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
				console.log('Screen Wake Lock acquired for background tracking');
			} catch (err: any) {
				console.warn(`Screen Wake Lock error: ${err.message}`);
			}
		}
	}, []);

	const releaseWakeLock = useCallback(async () => {
		if (wakeLockRef.current) {
			await wakeLockRef.current.release();
			wakeLockRef.current = null;
			console.log('Screen Wake Lock released');
		}
	}, []);

	const keepMediaAlive = useCallback((mediaStream: MediaStream | null) => {
		if (!mediaStream) return;

		// Clear any existing interval
		if (mediaKeepAliveIntervalRef.current) {
			clearInterval(mediaKeepAliveIntervalRef.current);
		}

		const videoTracks = mediaStream.getVideoTracks();
		if (videoTracks.length === 0) return;

		// Periodic reactivation (every 20 seconds)
		mediaKeepAliveIntervalRef.current = setInterval(() => {
			videoTracks.forEach((track) => {
				if (track.readyState === 'live' && !track.enabled) {
					track.enabled = true;
					console.log('Reactivated video track in background');
				}
			});
		}, 20000);
	}, []);

	const stopMediaKeepAlive = useCallback(() => {
		if (mediaKeepAliveIntervalRef.current) {
			clearInterval(mediaKeepAliveIntervalRef.current);
			mediaKeepAliveIntervalRef.current = null;
		}
	}, []);

	return {
		acquireWakeLock,
		releaseWakeLock,
		keepMediaAlive,
		stopMediaKeepAlive,
	};
};

const PictureInMode = () => {
	const { videoRef, canvasRef, isActive, loading, startTracking, stopTracking } =
		useEyeTrackingContext();

	const { isPiPExpanded, setIsPiPExpanded, isFullScreen } = usePiP();
	const { isVideoReady, isHovered, updateState } = usePiPState();
	const { toggleFullScreen } = useFullScreen();

	const params = useParams();
	const containerRef = useRef<HTMLDivElement>(null);
	const [isInPiPMode, setIsInPiPMode] = useState(false);
	const [isAutoPiP, setIsAutoPiP] = useState(false);
	const pipWindowRef = useRef<Window | null>(null);
	const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const pipVideoRef = useRef<HTMLVideoElement | null>(null);
	const animationFrameRef = useRef<number>(0);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const isPiPSupportedRef = useRef(false);
	const isDocumentPiPRef = useRef(false);

	// Background tracking hooks
	const isVisible = usePageVisibility();
	const { acquireWakeLock, releaseWakeLock, keepMediaAlive, stopMediaKeepAlive } =
		useBackgroundTracking();

	useVideoSync(videoRef, canvasRef, isVideoReady);

	// Check if PiP is supported
	useEffect(() => {
		const checkPipSupport = () => {
			const video = document.createElement('video');
			isPiPSupportedRef.current = !!(
				window.documentPictureInPicture ||
				(video.requestPictureInPicture && document.pictureInPictureEnabled)
			);
			isDocumentPiPRef.current = !!window.documentPictureInPicture;
		};

		checkPipSupport();
	}, []);

	// Store media stream reference with background optimization
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		const handleLoadedMetadata = () => {
			if (video.srcObject) {
				mediaStreamRef.current = video.srcObject as MediaStream;

				// Optimize for background operation
				if (mediaStreamRef.current) {
					mediaStreamRef.current.getTracks().forEach((track) => {
						// Set optimal constraints for background
						if (track.kind === 'video') {
							track.enabled = true;
							// Apply constraints that work better in background
							const constraints = {
								frameRate: { ideal: 15, max: 30 }, // Lower frame rate for background
								width: { ideal: 640, max: 1280 },
								height: { ideal: 480, max: 720 },
							};

							try {
								(track as any).applyConstraints(constraints);
							} catch (e) {
								console.log('Could not apply background constraints:', e);
							}
						}
					});
				}
			}
		};

		video.addEventListener('loadedmetadata', handleLoadedMetadata);
		return () => {
			video.removeEventListener('loadedmetadata', handleLoadedMetadata);
		};
	}, [videoRef]);

	// Background tracking management
	useEffect(() => {
		if (isActive && !isVisible) {
			// App in background - maintain tracking
			console.log('App in background, maintaining tracking...');
			acquireWakeLock();
			if (mediaStreamRef.current) {
				keepMediaAlive(mediaStreamRef.current);
			}
		} else if (!isActive || isVisible) {
			// App in foreground or tracking stopped - cleanup
			stopMediaKeepAlive();
		}

		return () => {
			stopMediaKeepAlive();
		};
	}, [isActive, isVisible, acquireWakeLock, keepMediaAlive, stopMediaKeepAlive]);

	// Enhanced start tracking with background support
	const enhancedStartTracking = useCallback(async () => {
		console.log('[Enhanced Tracking] Starting with background support');

		// Request background permissions if available
		if ('wakeLock' in navigator) {
			await acquireWakeLock();
		}

		await startTracking();

		// Ensure media stream is optimized for background
		if (mediaStreamRef.current) {
			keepMediaAlive(mediaStreamRef.current);
		}
	}, [startTracking, acquireWakeLock, keepMediaAlive]);

	// Enhanced stop tracking
	const enhancedStopTracking = useCallback(async () => {
		console.log('[Enhanced Tracking] Stopping with cleanup');
		stopTracking();
		await releaseWakeLock();
		stopMediaKeepAlive();
	}, [stopTracking, releaseWakeLock, stopMediaKeepAlive]);

	// Function to copy canvas content to PiP window
	const copyCanvasToPiP = useCallback(() => {
		if (!pipCanvasRef.current || !canvasRef.current || !isActive) return;

		const sourceCanvas = canvasRef.current;
		const targetCanvas = pipCanvasRef.current;

		if (sourceCanvas.width === 0 || sourceCanvas.height === 0) {
			animationFrameRef.current = requestAnimationFrame(copyCanvasToPiP);
			return;
		}

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
			ctx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
		}

		if (isInPiPMode) {
			animationFrameRef.current = requestAnimationFrame(copyCanvasToPiP);
		}
	}, [canvasRef, isActive, isInPiPMode]);

	const exitPiPMode = useCallback(async (): Promise<boolean> => {
		try {
			// Cancel animation frame
			cancelAnimationFrame(animationFrameRef.current);

			// Handle Document PiP API
			if (pipWindowRef.current) {
				pipWindowRef.current.close();
			}
			// Handle standard PiP API
			else if (document.pictureInPictureElement) {
				await document.exitPictureInPicture();
			}

			// Clean up references
			pipWindowRef.current = null;
			pipCanvasRef.current = null;
			pipVideoRef.current = null;
			setIsInPiPMode(false);
			setIsAutoPiP(false);

			return true;
		} catch (error) {
			console.error('Failed to exit PiP mode:', error);
			return false;
		}
	}, []);

	// Enhanced PiP mode with background support
	const enterPiPMode = useCallback(
		async (isAutomatic = false): Promise<boolean> => {
			if (!isPiPSupportedRef.current || !videoRef.current || isInPiPMode || !isActive)
				return false;

			try {
				// Get the media stream from the video element
				if (!mediaStreamRef.current && videoRef.current.srcObject) {
					mediaStreamRef.current = videoRef.current.srcObject as MediaStream;
				}

				if (!mediaStreamRef.current) {
					console.error('No media stream available for PiP');
					return false;
				}

				// Ensure media stream is optimized for background/PiP
				mediaStreamRef.current.getVideoTracks().forEach((track) => {
					track.enabled = true;

					// Apply PiP-optimized constraints
					const constraints = {
						frameRate: { ideal: 20 },
						width: { ideal: 640 },
						height: { ideal: 480 },
					};

					try {
						track.applyConstraints(constraints);
					} catch (e) {
						console.log('Could not apply PiP constraints:', e);
					}
				});

				// Request wake lock for PiP mode
				if ('wakeLock' in navigator) {
					await acquireWakeLock();
				}

				// Use Document PiP API if available
				if (isDocumentPiPRef.current && window.documentPictureInPicture) {
					const pipWindow = await window.documentPictureInPicture.requestWindow({
						width: 320,
						height: 200,
					});

					pipWindowRef.current = pipWindow;

					// Copy minimal necessary styles
					const style = document.createElement('style');
					style.textContent = `
          body { margin: 0; padding: 0; overflow: hidden; background: #000; }
          .pip-container { width: 100%; height: 100%; position: relative; overflow: hidden; }
          .pip-video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
          .pip-canvas { 
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
            object-fit: cover; transform: scaleX(-1); pointer-events: none; z-index: 10;
          }
          .pip-controls {
            position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
            display: flex; gap: 8px; z-index: 20; opacity: 0; transition: opacity 0.3s ease;
          }
          .pip-controls button {
            width: 32px; height: 32px; border: none; border-radius: 50%;
            background: rgba(0, 0, 0, 0.7); color: white; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
          }
        `;
					pipWindow.document.head.appendChild(style);

					// Create container in PiP window
					const container = document.createElement('div');
					container.className = 'pip-container';

					// Create video element for PiP window
					const videoClone = document.createElement('video');
					videoClone.className = 'pip-video';
					videoClone.autoplay = true;
					videoClone.playsInline = true;
					videoClone.muted = true;
					videoClone.srcObject = mediaStreamRef.current;

					pipVideoRef.current = videoClone;

					// Create canvas for PiP window - match exact dimensions
					const canvasClone = document.createElement('canvas');
					canvasClone.className = 'pip-canvas';

					// Set exact dimensions to match source canvas
					if (canvasRef.current) {
						canvasClone.width = canvasRef.current.width;
						canvasClone.height = canvasRef.current.height;
					}

					pipCanvasRef.current = canvasClone;

					// Create controls
					const controlsContainer = document.createElement('div');
					controlsContainer.className = 'pip-controls';

					// Exit button
					const exitButton = document.createElement('button');
					exitButton.innerHTML = '✕';
					exitButton.title = 'Exit PiP';
					exitButton.addEventListener('click', async () => {
						await exitPiPMode();
						await releaseWakeLock();
					});

					controlsContainer.appendChild(exitButton);

					container.appendChild(videoClone);
					container.appendChild(canvasClone);
					pipWindow.document.body.appendChild(container);
					pipWindow.document.body.appendChild(controlsContainer);

					// Add hover effect to show controls
					pipWindow.document.body.addEventListener('mouseenter', () => {
						controlsContainer.style.opacity = '1';
					});

					pipWindow.document.body.addEventListener('mouseleave', () => {
						controlsContainer.style.opacity = '0';
					});

					// Start the video in the PiP window
					videoClone
						.play()
						.catch((e) => console.error('Failed to play video in PiP:', e));

					// Handle PiP window closing
					pipWindow.addEventListener('pagehide', async () => {
						cancelAnimationFrame(animationFrameRef.current);
						setIsInPiPMode(false);
						setIsAutoPiP(false);
						pipWindowRef.current = null;
						pipCanvasRef.current = null;
						pipVideoRef.current = null;
						await releaseWakeLock();
					});

					// Start copying canvas content
					animationFrameRef.current = requestAnimationFrame(copyCanvasToPiP);
				}
				// Fallback to standard PiP API
				else if (videoRef.current.requestPictureInPicture) {
					await videoRef.current.requestPictureInPicture();
				}

				setIsInPiPMode(true);
				if (isAutomatic) setIsAutoPiP(true);
				return true;
			} catch (error) {
				console.error('Failed to enter PiP mode:', error);
				await releaseWakeLock();
				return false;
			}
		},
		[
			videoRef,
			isInPiPMode,
			isActive,
			copyCanvasToPiP,
			canvasRef,
			exitPiPMode,
			acquireWakeLock,
			releaseWakeLock,
		]
	);

	// Enhanced toggle tracking with background support
	const handleToggleTracking = useCallback(async () => {
		if (isActive) {
			await enhancedStopTracking();
			// Also exit PiP if it was auto-activated
			if (isAutoPiP) {
				await exitPiPMode();
			}
		} else {
			try {
				await enhancedStartTracking();
			} catch (err) {
				console.error('Failed to start tracking:', err);
				updateState({ error: 'Failed to start tracking' });
			}
		}
	}, [
		isActive,
		isAutoPiP,
		enhancedStartTracking,
		enhancedStopTracking,
		updateState,
		exitPiPMode,
	]);

	const handleToggleFullScreen = async () => {
		await toggleFullScreen(containerRef.current);
	};

	const handleToggleExpanded = () => {
		setIsPiPExpanded(!isPiPExpanded);
	};

	const handleTogglePiP = async () => {
		if (isInPiPMode) {
			await exitPiPMode();
		} else {
			await enterPiPMode(false);
		}
	};

	const handleMouseEnter = () => updateState({ isHovered: true });
	const handleMouseLeave = () => updateState({ isHovered: false });

	// Auto-start tracking with background considerations
	useEffect(() => {
		if (isActive && videoRef.current?.srcObject === null && !loading) {
			enhancedStartTracking().catch((err) => {
				console.error('Auto-start failed:', err);
				updateState({ error: 'Failed to auto-start tracking' });
			});
		}
	}, [isActive, loading, enhancedStartTracking, updateState, videoRef]);

	// Enhanced auto-start with background check
	useEffect(() => {
		if (isActive && videoRef.current?.srcObject === null) {
			console.log('Auto-starting tracking with background support');
			enhancedStartTracking().catch((err) => {
				console.error('Auto-start failed:', err);
				updateState({ error: 'Failed to auto-start tracking' });
			});
		}
	}, [isActive, enhancedStartTracking, updateState, videoRef]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopMediaKeepAlive();
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			releaseWakeLock();
		};
	}, [stopMediaKeepAlive, releaseWakeLock]);

	return (
		<div
			ref={containerRef}
			className={`${styles.cameraContainer} ${
				isPiPExpanded ? styles.expanded : styles.collapsed
			} ${isFullScreen ? styles.fullscreen : ''}
      ${isLivePage ? styles['hidden'] : ''}
      ${isInPiPMode ? styles.pipMode : ''}
      ${!isVisible ? styles.backgroundMode : ''}
      `}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<div className={styles.glassEffect}>
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted
					className={styles.video}
					onLoadedData={() => updateState({ isVideoReady: true })}
					onError={() => updateState({ isVideoReady: false })}
				/>

				<canvas
					ref={canvasRef}
					className={styles.canvas}
					style={{
						display: isVideoReady && isActive ? 'block' : 'none',
						opacity: isActive ? 1 : 0,
						transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
					}}
				/>

				<ControlButtons
					isActive={isActive}
					isExpanded={isPiPExpanded}
					isFullScreen={isFullScreen}
					isHovered={isHovered}
					isInPiPMode={isInPiPMode}
					onToggleTracking={handleToggleTracking}
					onToggleExpanded={handleToggleExpanded}
					onToggleFullScreen={handleToggleFullScreen}
					onTogglePiP={handleTogglePiP}
				/>

				<StatusIndicator
					isActive={isActive}
					isExpanded={isPiPExpanded}
					isFullScreen={isFullScreen}
					isInPiPMode={isInPiPMode}
					isAutoPiP={isAutoPiP}
					isBackground={!isVisible}
				/>

				<FullScreenClose isFullScreen={isFullScreen} onClose={handleToggleFullScreen} />
			</div>
		</div>
	);
};

export default PictureInMode;
