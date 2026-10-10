'use client';

import useTranslationData from '@/hooks/use-translation-data';
import { EyeMetrics } from '@/hooks/useEyeTracking';
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import { Flashlight, PlayCircle, StopCircle, SwitchCamera, Zap, ZapOff } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './camscreen.module.css';

interface CamScreenProps {
	onMetricsUpdate?: (metrics: EyeMetrics) => void;
	showOverlay?: boolean;
	oldVideoRef: React.RefObject<HTMLVideoElement | null>;
	oldCanvasRef: React.RefObject<HTMLCanvasElement | null>;
	loading: boolean;
	error: string | null;
	isActive: boolean;
	cameraReady: boolean;
	onToggleTracking: () => void;
}

export const CamScreen: React.FC<CamScreenProps> = ({
	oldVideoRef,
	oldCanvasRef,
	loading,
	error,
	isActive,
	cameraReady,
	onToggleTracking,
}) => {
	const [isVideoReady, setIsVideoReady] = useState(false);
	const [isFlashOn, setIsFlashOn] = useState(false);
	const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user');
	const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
	const newVideoRef = useRef<HTMLVideoElement | null>(null);
	const newCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const { camScreenText } = useTranslationData();
	const { stream } = useEyeTrackingContext();

	// Handle video stream setup
	useEffect(() => {
		if (newVideoRef.current && oldVideoRef.current?.srcObject) {
			newVideoRef.current.srcObject = oldVideoRef.current.srcObject;
		}
	}, [oldVideoRef, oldVideoRef?.current?.srcObject]);

	// Handle canvas drawing from old canvas to new canvas
	useEffect(() => {
		const drawCanvas = () => {
			const oldCanvas = oldCanvasRef.current;
			const newCanvas = newCanvasRef.current;

			if (oldCanvas && newCanvas) {
				const ctx = newCanvas.getContext('2d');
				if (ctx) {
					// Clear the new canvas
					ctx.clearRect(0, 0, newCanvas.width, newCanvas.height);

					// Draw the old canvas content to the new canvas
					ctx.drawImage(oldCanvas, 0, 0, newCanvas.width, newCanvas.height);
				}
			}

			// Continue the animation loop
			animationFrameRef.current = requestAnimationFrame(drawCanvas);
		};

		if (isActive && isVideoReady) {
			animationFrameRef.current = requestAnimationFrame(drawCanvas);
		}

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [isActive, isVideoReady, oldCanvasRef]);

	// Handle canvas synchronization with video
	useEffect(() => {
		const video = newVideoRef.current;
		const canvas = newCanvasRef.current;

		if (video && canvas && isVideoReady) {
			// Sync canvas size with video
			if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
			}
		}
	}, [isVideoReady, isActive]);

	const enumerateCameras = useCallback(async () => {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const cameras = devices.filter(device => device.kind === 'videoinput');
			setAvailableCameras(cameras);
		} catch (error) {
			console.error('Error enumerating cameras:', error);
		}
	}, []);

	const toggleFlash = useCallback(async () => {
		if (!stream) return;

		try {
			const videoTrack = stream.getVideoTracks()[0];
			if (!videoTrack) return;

			const capabilities = videoTrack.getCapabilities() as any;
			if (!capabilities.torch) {
				console.warn('Flash/torch not supported on this device');
				return;
			}

			const newFlashState = !isFlashOn;
			await videoTrack.applyConstraints({
				advanced: [{ torch: newFlashState } as any]
			});
			setIsFlashOn(newFlashState);
		} catch (error) {
			console.error('Error toggling flash:', error);
		}
	}, [stream, isFlashOn]);

	const switchCamera = useCallback(async () => {
		if (availableCameras.length < 2) {
			console.warn('Only one camera available');
			return;
		}

		try {
			if (stream) {
				stream.getTracks().forEach(track => track.stop());
			}

			const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
			
			const newStream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: newFacingMode,
					width: { ideal: 1280 },
					height: { ideal: 720 }
				},
				audio: false
			});

			if (oldVideoRef.current) {
				oldVideoRef.current.srcObject = newStream;
			}
			if (newVideoRef.current) {
				newVideoRef.current.srcObject = newStream;
			}
			setCurrentFacingMode(newFacingMode);
			setIsFlashOn(false); 
		} catch (error) {
			console.error('Error switching camera:', error);
		}
	}, [availableCameras, currentFacingMode, stream, oldVideoRef]);

	// Handle video readiness
	useEffect(() => {
		const video = newVideoRef.current;
		if (!video) return;

		const handleLoadedData = () => {
			setIsVideoReady(true);
		};

		const handleError = () => {
			setIsVideoReady(false);
		};

		video.addEventListener('loadeddata', handleLoadedData);
		video.addEventListener('error', handleError);

		return () => {
			video.removeEventListener('loadeddata', handleLoadedData);
			video.removeEventListener('error', handleError);
		};
	}, []);

	// Enumerate cameras on mount
	useEffect(() => {
		enumerateCameras();
	}, [enumerateCameras]);

	return (
		<div className={styles.container}>
			<div className={styles.cameraContainer}>
				<video
					ref={newVideoRef}
					autoPlay
					playsInline
					muted
					className={styles.video}
					style={{ display: isVideoReady ? 'block' : 'none' }}
				/>

				<canvas
					ref={newCanvasRef}
					className={styles.canvas}
					style={{
						display: isVideoReady && isActive ? 'block' : 'none',
						opacity: isActive ? 1 : 0,
						transition: 'opacity 0.3s ease',
					}}
				/>

				{/* Control buttons and overlays */}
				<div className={styles.controlButtons}>
					<button 
						className={styles.controlButtonMobile }
						onClick={toggleFlash}
						title={isFlashOn ? 'Turn off flash' : 'Turn on flash'}
					>
                       {isFlashOn ? <ZapOff size={28} /> : <Zap size={28} />}
					</button>
					<button
						className={`${styles.controlButton} ${isActive ? styles.active : ''}`}
						onClick={onToggleTracking}
						title={isActive ? 'Stop tracking' : 'Start tracking'}
					>
						{isActive ? <StopCircle size={28} /> : <PlayCircle size={28} />}
					</button>
					<button 
				   className={styles.controlButtonMobile }
						onClick={switchCamera}
						disabled={availableCameras.length < 2}
						title={availableCameras.length > 1 ? `Switch to ${currentFacingMode === 'user' ? 'back' : 'front'} camera` : 'Only one camera available'}
					>
                        <SwitchCamera size={28} />
					</button>
					
				</div>

				{/* Loading and error states */}
				{loading && (
					<div className={styles.overlay}>
						<div className={styles.loading}>
							<div className={styles.spinner}></div>
							<p>
								{isVideoReady
									? camScreenText.loadingStates.startingTracking
									: camScreenText.loadingStates.initializingCamera}
							</p>
						</div>
					</div>
				)}

				{error && (
					<div className={styles.overlay}>
						<div className={styles.error}>
							<p>{error}</p>
							<button onClick={onToggleTracking} className={styles.retryButton}>
								{camScreenText.retryButton}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default CamScreen;
