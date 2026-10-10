import { COLOR_SCHEMES, EYE_TRACKING_CONSTANTS } from '@/constants/eye-tracking';
import useAppStore from '@/store';
import { DrawingUtils, FaceLandmarker, FilesetResolver } from '@/utils/mediapipe';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef, useState } from 'react';

// Type definitions
export type EyeMetrics = {
	timestamp: string;
	blinkRate: number;
	perClose: number;
	perclos?: number;
	attentionFrac: number;
	strainLevelIdx: 0 | 1 | 2;
	strainText: string;
	tiredText: string;
	attBinary: 0 | 1;
	eyeAspectRatio: number;
	pupilDilation: number;
	squintIntensity: number;
	darkCircleScore?: number;
	tirednessScore?: number;
	eyeAgeIndex?: number;
	eyeAge: number;
	faceAge: number;
};

export type DrawingColors = {
	faceMesh: string;
	rightEye: string;
	leftEye: string;
	rightIris: string;
	leftIris: string;
	rightEyebrow: string;
	leftEyebrow: string;
	lips: string;
	faceOval: string;
	background: string;
	text: string;
	highlight: string;
};

export type ColorScheme = 'default' | 'minimal';

export type EyeTrackingOptions = {
	colors?: Partial<DrawingColors>;
	colorScheme?: ColorScheme;
	drawFaceMesh?: boolean;
	drawEyes?: boolean;
	drawIris?: boolean;
	drawEyebrows?: boolean;
	drawLips?: boolean;
	drawFaceOval?: boolean;
	metricsUpdateInterval?: number;
	blinkDetectionThreshold?: number;
	videoConstraints?: MediaTrackConstraints;
};

type Point = { x: number; y: number };

const clamp01 = (value: number) =>
	Math.max(0, Math.min(EYE_TRACKING_CONSTANTS.VISUAL.CLAMP_ONE, value));
const distanceBetweenPoints = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function getSafeRectangle(
	x: number,
	y: number,
	width: number,
	height: number,
	canvasWidth: number,
	canvasHeight: number
) {
	const rectX = Math.max(0, Math.min(canvasWidth - 1, Math.round(x)));
	const rectY = Math.max(0, Math.min(canvasHeight - 1, Math.round(y)));
	const rectWidth = Math.max(1, Math.min(canvasWidth - rectX, Math.round(width)));
	const rectHeight = Math.max(1, Math.min(canvasHeight - rectY, Math.round(height)));
	return { x: rectX, y: rectY, width: rectWidth, height: rectHeight };
}

function calculateMeanLuminance(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number
): number {
	const { canvas } = context;
	const rect = getSafeRectangle(x, y, width, height, canvas.width, canvas.height);
	const imageData = context.getImageData(rect.x, rect.y, rect.width, rect.height);
	const data = imageData.data;
	let sum = 0;
	let count = 0;

	for (let i = 0; i < data.length; i += 4) {
		const red = data[i];
		const green = data[i + 1];
		const blue = data[i + 2];
		sum +=
			EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.RED * red +
			EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.GREEN * green +
			EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.BLUE * blue;
		count++;
	}
	return count ? sum / count : 0;
}

type EyeKeypoints = { inner: Point; outer: Point; top: Point; bottom: Point };

function getUnderEyeAndReferenceRectangles(eye: EyeKeypoints) {
	const eyeWidth = distanceBetweenPoints(eye.inner, eye.outer);
	const centerX = (eye.inner.x + eye.outer.x) * 0.5;

	const underEyeWidth = EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.WIDTH_MULTIPLIER * eyeWidth;
	const underEyeHeight = EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.HEIGHT_MULTIPLIER * eyeWidth;
	const underEyeX = centerX - underEyeWidth / 2;
	const underEyeY = eye.bottom.y + EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.Y_OFFSET * eyeWidth;

	const cheekWidth = EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.WIDTH_MULTIPLIER * underEyeWidth;
	const cheekHeight = EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.HEIGHT_MULTIPLIER * underEyeHeight;
	const cheekX = centerX - cheekWidth / 2;
	const cheekY =
		underEyeY + underEyeHeight + EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.Y_OFFSET * eyeWidth;

	const foreheadWidth = EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.WIDTH_MULTIPLIER * underEyeWidth;
	const foreheadHeight =
		EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.HEIGHT_MULTIPLIER * underEyeHeight;
	const foreheadX = centerX - foreheadWidth / 2;
	const foreheadY =
		eye.top.y - EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.Y_OFFSET * eyeWidth - foreheadHeight;

	return {
		underEye: { x: underEyeX, y: underEyeY, width: underEyeWidth, height: underEyeHeight },
		cheek: { x: cheekX, y: cheekY, width: cheekWidth, height: cheekHeight },
		forehead: { x: foreheadX, y: foreheadY, width: foreheadWidth, height: foreheadHeight },
	};
}

function calculateBlinkPenalty(blinksPerMinute: number) {
	return clamp01(
		Math.abs(blinksPerMinute - EYE_TRACKING_CONSTANTS.BLINK.TARGET_PER_MIN) /
			EYE_TRACKING_CONSTANTS.BLINK.PENALTY_DIVISOR
	);
}

function normalizePerclos(perclosValue: number) {
	return clamp01(
		(perclosValue - EYE_TRACKING_CONSTANTS.METRICS.PERCLOS_NORMALIZATION.SUBTRACT) /
			EYE_TRACKING_CONSTANTS.METRICS.PERCLOS_NORMALIZATION.DIVIDE
	);
}

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

		// Periodic reactivation (every 15 seconds for background)
		mediaKeepAliveIntervalRef.current = setInterval(() => {
			videoTracks.forEach((track) => {
				if (track.readyState === 'live' && !track.enabled) {
					track.enabled = true;
					console.log('Reactivated video track in background');
				}
			});
		}, 15000);
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

export const useEyeTracking = (options: EyeTrackingOptions = {}) => {
	const t = useTranslations();

	// Store state with proper destructuring and fallbacks
	const storeState = useAppStore();

	const isCameraActive = storeState?.camera?.isCameraActive ?? false;
	const isTrackingActive = storeState?.camera?.isTrackingActive ?? false;
	const loading = storeState?.camera?.loading ?? false;
	const currentMetrics = storeState?.eyeTracking?.currentMetrics ?? null;
	const metricsHistory = storeState?.eyeTracking?.metricsHistory ?? [];
	const dailyScreenTime = storeState?.screenTime?.dailyScreenTime ?? 0;
	const authUser = storeState?.firebase?.authUser ?? null;
	const isLoggedIn = storeState?.firebase?.isLoggedIn ?? false;

	// Store actions with proper fallbacks
	const getLastBlinkRate = useMemo(
		() => storeState?.eyeTracking?.getLastBlinkRate?.() ?? 0,
		[storeState]
	);

	const getLastMetrics = useMemo(
		() => storeState?.eyeTracking?.getLastMetrics?.() ?? (() => null),
		[storeState]
	);

	const setCameraState = useMemo(
		() =>
			storeState?.camera?.setCameraState ??
			(() => console.warn('setCameraState is not available')),
		[storeState]
	);

	const setTrackingState = useMemo(
		() =>
			storeState?.camera?.setTrackingState ??
			(() => console.warn('setTrackingState is not available')),
		[storeState]
	);

	const setLoading = useMemo(
		() => storeState?.camera?.setLoading ?? (() => console.warn('setLoading is not available')),
		[storeState]
	);

	const setAuthUser = useMemo(
		() =>
			storeState?.firebase?.setAuthUser ??
			(() => console.warn('setAuthUser is not available')),
		[storeState]
	);

	const setError = useMemo(
		() =>
			storeState?.eyeTracking?.setError ?? (() => console.warn('setError is not available')),
		[storeState]
	);

	const startSession = useMemo(
		() =>
			storeState?.eyeTracking?.startSession ??
			(() => console.warn('startSession is not available')),
		[storeState]
	);

	const endSession = useMemo(
		() =>
			storeState?.eyeTracking?.endSession ??
			(() => console.warn('endSession is not available')),
		[storeState]
	);

	const updateStoreMetrics = useMemo(
		() =>
			storeState?.eyeTracking?.updateMetrics ??
			(() => console.warn('updateStoreMetrics is not available')),
		[storeState]
	);

	const startScreenTime = useMemo(
		() =>
			storeState?.screenTime?.startScreenTime ??
			(() => console.warn('startScreenTime is not available')),
		[storeState]
	);

	// Refs - ALL performance critical data stored in refs to prevent re-renders
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
	const drawingUtilsRef = useRef<DrawingUtils | null>(null);
	const animationFrameIdRef = useRef<number | null>(null);
	const metricsIntervalIdRef = useRef<number | null>(null);
	const blinkIntervalIdRef = useRef<number | null>(null);
	const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

	// Background tracking
	const { acquireWakeLock, releaseWakeLock, keepMediaAlive, stopMediaKeepAlive } =
		useBackgroundTracking();

	// Performance optimization refs - ALL in refs to prevent re-renders
	const totalFramesRef = useRef(0);
	const closedFramesRef = useRef(0);
	const facePresentFramesRef = useRef(0);
	const previousEyesClosedRef = useRef(false);
	const closedSamplesRef = useRef<Array<{ timestamp: number; closed: boolean }>>([]);
	const darkCircleScoreRef = useRef(0);
	const streamDataRef = useRef<any[]>([]);
	const blinkTimestampsRef = useRef<number[]>([]);
	const lastFrameTimeRef = useRef<number>(0);
	const frameCountRef = useRef(0);
	const isProcessingRef = useRef(false); // Critical: prevents overlapping processing

	const lastValidBlinkRateRef = useRef<number>(
		getLastBlinkRate || EYE_TRACKING_CONSTANTS.FALLBACK.BLINK_RATE
	);
	const lastValidEyeAgeRef = useRef<number>(
		getLastMetrics?.eyeAge || EYE_TRACKING_CONSTANTS.FALLBACK.EYE_AGE
	);
	const lastValidFaceAgeRef = useRef<number>(
		getLastMetrics?.faceAge || EYE_TRACKING_CONSTANTS.FALLBACK.FACE_AGE
	);

	const [isInitialized, setIsInitialized] = useState(false);

	// Options with performance-optimized defaults
	const {
		colorScheme = 'minimal',
		colors = {},
		drawFaceMesh = false, // Reduced for performance
		drawEyes = true,
		drawIris = true,
		drawEyebrows = false, // Reduced for performance
		drawLips = false, // Reduced for performance
		drawFaceOval = false, // Reduced for performance
		metricsUpdateInterval = EYE_TRACKING_CONSTANTS.METRICS.UPDATE_INTERVAL,
		blinkDetectionThreshold = EYE_TRACKING_CONSTANTS.BLINK.DETECTION_THRESHOLD,
		videoConstraints = {
			width: { ideal: 480, max: 640 }, // Lower resolution for performance
			height: { ideal: 360, max: 480 },
			facingMode: 'user',
			frameRate: { ideal: 20, max: 25 }, // Lower frame rate for background
			focusMode: 'continuous',
		},
	} = options;

	const drawingColors: DrawingColors = useMemo(
		() => ({ ...COLOR_SCHEMES[colorScheme], ...colors }),
		[colorScheme, colors]
	);

	// Critical: Memoize all callbacks to prevent re-renders
	const calculateEyeAge = useCallback(
		(blinkRate: number, perclos: number, darkCircleValue: number) => {
			if (blinkRate <= 0 || isNaN(blinkRate)) return lastValidEyeAgeRef.current;

			const blinkPenalty = calculateBlinkPenalty(blinkRate);
			const eyeAgeIndex = clamp01(
				EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.PERCLOS * normalizePerclos(perclos) +
					EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.DARK * darkCircleValue +
					EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.BLINK * blinkPenalty
			);

			const eyeAgeYears = Math.round(
				EYE_TRACKING_CONSTANTS.AGE.MIN_EYE +
					eyeAgeIndex *
						(EYE_TRACKING_CONSTANTS.AGE.MAX_EYE - EYE_TRACKING_CONSTANTS.AGE.MIN_EYE)
			);

			if (eyeAgeYears > 0 && eyeAgeYears <= EYE_TRACKING_CONSTANTS.AGE.ABSOLUTE_MAX) {
				lastValidEyeAgeRef.current = eyeAgeYears;
			}

			return eyeAgeYears;
		},
		[]
	);

	const calculateFaceAge = useCallback(
		(eyeAge: number, attentionFraction: number, squintValue: number) => {
			let calculatedFaceAge = eyeAge;
			calculatedFaceAge +=
				(1 - attentionFraction) * EYE_TRACKING_CONSTANTS.AGE.FACE_ATTENTION_IMPACT;
			calculatedFaceAge += (squintValue - 15) / 5;

			const finalFaceAge = Math.max(
				EYE_TRACKING_CONSTANTS.AGE.MIN_FACE,
				Math.min(EYE_TRACKING_CONSTANTS.AGE.MAX_FACE, Math.round(calculatedFaceAge))
			);

			if (finalFaceAge > 0 && finalFaceAge <= 100) {
				lastValidFaceAgeRef.current = finalFaceAge;
			}

			return finalFaceAge;
		},
		[]
	);

	const updateAllMetrics = useCallback(() => {
		const timestamp = new Date().toLocaleTimeString();
		const now = Date.now();
		const oneMinuteAgo = now - EYE_TRACKING_CONSTANTS.BLINK.WINDOW_MS;

		// Filter blink timestamps
		blinkTimestampsRef.current = blinkTimestampsRef.current.filter(
			(timestamp) => timestamp > oneMinuteAgo
		);
		const rawBlinkRate = blinkTimestampsRef.current.length;
		const blinkRate = rawBlinkRate === 0 ? lastValidBlinkRateRef.current : rawBlinkRate;
		if (rawBlinkRate !== 0) lastValidBlinkRateRef.current = blinkRate;

		// Filter closed samples
		closedSamplesRef.current = closedSamplesRef.current.filter(
			(sample) => sample.timestamp > now - EYE_TRACKING_CONSTANTS.PERCLOS.WINDOW_MS
		);

		let perclos = 0;
		if (closedSamplesRef.current.length > 1) {
			let closedMilliseconds = 0;
			const samples = closedSamplesRef.current;

			for (let i = 0; i < samples.length - 1; i++) {
				const timeDifference = samples[i + 1].timestamp - samples[i].timestamp;
				if (samples[i].closed) closedMilliseconds += timeDifference;
			}

			const totalMilliseconds = samples[samples.length - 1].timestamp - samples[0].timestamp;
			perclos = totalMilliseconds > 0 ? closedMilliseconds / totalMilliseconds : 0;
		}

		const percentageClosed =
			totalFramesRef.current > 0
				? (closedFramesRef.current / totalFramesRef.current) * 100
				: 0;

		const attentionFraction =
			totalFramesRef.current > 0 ? facePresentFramesRef.current / totalFramesRef.current : 0;

		// Get translated strain levels
		const strainLevels = {
			low: t('strainLevels.low'),
			moderate: t('strainLevels.moderate'),
			high: t('strainLevels.high'),
			veryHigh: t('strainLevels.veryHigh'),
			tired: t('strainLevels.tired'),
			sleepy: t('strainLevels.sleepy'),
			exhausted: t('strainLevels.exhausted'),
		};

		// Determine strain text based on blink rate
		let strainText: string;
		if (blinkRate < 12) strainText = strainLevels.high;
		else if (blinkRate < 18) strainText = strainLevels.moderate;
		else strainText = strainLevels.low;

		// Determine tired text based on percentageClosed
		let tiredText: string;
		if (percentageClosed > EYE_TRACKING_CONSTANTS.PERCENTAGE.PERCLOS_THRESHOLDS.VERY_HIGH) {
			tiredText = strainLevels.veryHigh;
		} else if (percentageClosed > EYE_TRACKING_CONSTANTS.PERCENTAGE.PERCLOS_THRESHOLDS.HIGH) {
			tiredText = strainLevels.high;
		} else if (
			percentageClosed > EYE_TRACKING_CONSTANTS.PERCENTAGE.PERCLOS_THRESHOLDS.MODERATE
		) {
			tiredText = strainLevels.moderate;
		} else {
			tiredText = strainLevels.low;
		}

		const blinkPenalty = calculateBlinkPenalty(blinkRate);
		const darkCircleValue = darkCircleScoreRef.current;
		const tiredness = clamp01(
			EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.PERCLOS * normalizePerclos(perclos) +
				EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.DARK * darkCircleValue +
				EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.BLINK * blinkPenalty
		);

		const eyeAgeIndex = clamp01(
			EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.PERCLOS * normalizePerclos(perclos) +
				EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.DARK * darkCircleValue +
				EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.BLINK * blinkPenalty
		);

		const eyeAge = calculateEyeAge(blinkRate, perclos, darkCircleValue);
		const squintIntensity =
			percentageClosed > 15
				? EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.HIGH.MIN +
					Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.HIGH.RANGE
				: EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.LOW.MIN +
					Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.LOW.RANGE;

		const faceAge = calculateFaceAge(eyeAge, attentionFraction, squintIntensity);

		const metrics: EyeMetrics = {
			timestamp,
			blinkRate,
			perClose: percentageClosed,
			perclos,
			attentionFrac: attentionFraction,
			strainLevelIdx: (blinkRate < 12 ? 2 : blinkRate < 18 ? 1 : 0) as 0 | 1 | 2,
			strainText,
			tiredText,
			attBinary:
				attentionFraction >= EYE_TRACKING_CONSTANTS.PERCENTAGE.ATTENTION_THRESHOLD ? 1 : 0,
			eyeAspectRatio:
				EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.BASE +
				blinkRate * EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.BLINK_FACTOR +
				Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.RANGE,
			pupilDilation: Math.max(
				EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.MIN,
				EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.BASE -
					percentageClosed * EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.PERCLOS_FACTOR +
					Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.RANGE
			),
			squintIntensity: squintIntensity,
			darkCircleScore: darkCircleValue,
			tirednessScore: tiredness,
			eyeAgeIndex: eyeAgeIndex,
			eyeAge,
			faceAge,
		};

		streamDataRef.current = [
			...streamDataRef.current.slice(-EYE_TRACKING_CONSTANTS.METRICS.HISTORY_LIMIT),
			metrics,
		];

		updateStoreMetrics(metrics);

		// Reset frame counters
		totalFramesRef.current = 0;
		closedFramesRef.current = 0;
		facePresentFramesRef.current = 0;
	}, [updateStoreMetrics, calculateEyeAge, calculateFaceAge, t]);

	// Optimized camera start with background support
	const startCamera = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					...videoConstraints,
					// Enhanced for background operation
					width: { ideal: 480, max: 640 },
					height: { ideal: 360, max: 480 },
					frameRate: { ideal: 20, max: 25 },
				},
				audio: false,
			});

			// Optimize tracks for background operation
			stream.getVideoTracks().forEach((track) => {
				track.enabled = true;
				// Apply constraints for better background performance
				try {
					track.applyConstraints({
						frameRate: { ideal: 20, max: 25 },
						width: { ideal: 480, max: 640 },
						height: { ideal: 360, max: 480 },
					});
				} catch (e) {
					console.log('Could not apply optimized constraints:', e);
				}
			});

			setMediaStream(stream);

			if (!videoRef.current) return null;

			videoRef.current.srcObject = stream;
			videoRef.current.playsInline = true;
			videoRef.current.muted = true;

			await new Promise<void>((resolve, reject) => {
				if (!videoRef.current) return reject(new Error('No video element'));

				const onLoaded = () => resolve();
				const onError = () => reject(new Error('Video loading failed'));

				videoRef.current!.onloadedmetadata = onLoaded;
				videoRef.current!.onerror = onError;

				// Timeout fallback
				setTimeout(() => {
					if (videoRef.current?.readyState >= 2) resolve();
					else reject(new Error('Video loading timeout'));
				}, 5000);
			});

			await videoRef.current.play().catch((e) => {
				console.warn('Video play failed, continuing anyway:', e);
			});

			// Start background tracking support
			keepMediaAlive(stream);
			await acquireWakeLock();

			return stream;
		} catch (error) {
			console.error('Camera error:', error);
			setCameraState({
				isCameraActive: false,
				cameraError: EYE_TRACKING_CONSTANTS.ERROR.CAMERA,
			});
			return null;
		}
	}, [setCameraState, videoConstraints, keepMediaAlive, acquireWakeLock]);

	const stopCamera = useCallback(() => {
		const stream = (videoRef.current?.srcObject as MediaStream) || null;
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
		stopMediaKeepAlive();
		releaseWakeLock();
	}, [stopMediaKeepAlive, releaseWakeLock]);

	const initializeFaceLandmarker = useCallback(async () => {
		try {
			setLoading(true);

			try {
				const vision = await FilesetResolver.forVisionTasks(
					EYE_TRACKING_CONSTANTS.PATHS.MEDIAPIPE.WASM
				);
				faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
					baseOptions: {
						modelAssetPath: EYE_TRACKING_CONSTANTS.PATHS.MEDIAPIPE.MODEL,
						delegate: 'GPU',
					},
					runningMode: 'VIDEO',
					numFaces: 1,
					outputFaceBlendshapes: false,
					outputFacialTransformationMatrixes: false,
				});
			} catch (localError) {
				console.warn('Local files failed, falling back to CDN:', localError);
				const vision = await FilesetResolver.forVisionTasks(
					EYE_TRACKING_CONSTANTS.PATHS.FALLBACK.WASM
				);
				faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
					baseOptions: {
						modelAssetPath: EYE_TRACKING_CONSTANTS.PATHS.FALLBACK.MODEL,
						delegate: 'GPU',
					},
					runningMode: 'VIDEO',
					numFaces: 1,
					outputFaceBlendshapes: false,
					outputFacialTransformationMatrixes: false,
				});
			}

			setIsInitialized(true);
			return true;
		} catch (error) {
			console.error('Failed to initialize face landmarker:', error);
			setError(EYE_TRACKING_CONSTANTS.ERROR.INIT);
			setIsInitialized(false);
			return false;
		} finally {
			setLoading(false);
		}
	}, [setError, setLoading]);

	const calculateLandmarkDistance = useCallback(
		(point1: any, point2: any) => Math.hypot(point1.x - point2.x, point1.y - point2.y),
		[]
	);

	// ULTRA-OPTIMIZED render frame - eliminates lag and re-renders
	const renderFrame = useCallback(
		(currentTime: number) => {
			// Critical: Prevent overlapping processing
			if (isProcessingRef.current) {
				animationFrameIdRef.current = requestAnimationFrame(renderFrame);
				return;
			}

			// Frame rate limiting - skip frames if too fast
			const now = performance.now();
			const elapsed = now - lastFrameTimeRef.current;

			// Target 20 FPS for background performance (instead of 30)
			if (elapsed < 50) {
				animationFrameIdRef.current = requestAnimationFrame(renderFrame);
				return;
			}

			lastFrameTimeRef.current = now;
			frameCountRef.current++;
			isProcessingRef.current = true;

			const video = videoRef.current;
			const canvas = canvasRef.current;
			const faceLandmarker = faceLandmarkerRef.current;

			if (
				!video ||
				!canvas ||
				!faceLandmarker ||
				video.readyState !== video.HAVE_ENOUGH_DATA
			) {
				isProcessingRef.current = false;
				animationFrameIdRef.current = requestAnimationFrame(renderFrame);
				return;
			}

			const context = canvas.getContext('2d');
			if (!context) {
				isProcessingRef.current = false;
				animationFrameIdRef.current = requestAnimationFrame(renderFrame);
				return;
			}

			// Update canvas dimensions if needed (less frequent check)
			if (
				frameCountRef.current % 15 === 0 &&
				(canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)
			) {
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
				drawingUtilsRef.current = new DrawingUtils(context);
			}

			try {
				const results = faceLandmarker.detectForVideo(video, currentTime);

				context.save();
				context.clearRect(0, 0, canvas.width, canvas.height);

				// Only draw video if in foreground for performance
				if (!document.hidden) {
					context.drawImage(video, 0, 0, canvas.width, canvas.height);
				}

				totalFramesRef.current += 1;

				if (results.faceLandmarks && results.faceLandmarks.length > 0) {
					const landmarks = results.faceLandmarks[0];
					facePresentFramesRef.current += 1;

					// Draw face landmarks (minimal drawing for performance)
					const drawingUtils = drawingUtilsRef.current!;

					if (drawEyes) {
						drawingUtils.drawConnectors(
							landmarks,
							FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
							{
								color: drawingColors.rightEye,
								lineWidth: 1,
							}
						);
						drawingUtils.drawConnectors(
							landmarks,
							FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
							{
								color: drawingColors.leftEye,
								lineWidth: 1,
							}
						);
					}

					if (drawIris) {
						drawingUtils.drawConnectors(
							landmarks,
							FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
							{
								color: drawingColors.rightIris,
								lineWidth: 1,
							}
						);
						drawingUtils.drawConnectors(
							landmarks,
							FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
							{
								color: drawingColors.leftIris,
								lineWidth: 1,
							}
						);
					}

					// Calculate eye aspect ratio for blink detection
					const leftHorizontal = calculateLandmarkDistance(landmarks[33], landmarks[133]);
					const leftVertical = calculateLandmarkDistance(landmarks[159], landmarks[145]);
					const rightHorizontal = calculateLandmarkDistance(
						landmarks[362],
						landmarks[263]
					);
					const rightVertical = calculateLandmarkDistance(landmarks[386], landmarks[374]);

					const leftRatio = leftVertical > 0 ? leftHorizontal / leftVertical : 0;
					const rightRatio = rightVertical > 0 ? rightHorizontal / rightVertical : 0;
					const averageRatio = (leftRatio + rightRatio) / 2;

					const eyesClosed = averageRatio > blinkDetectionThreshold;

					// Track closed samples for PERCLOS calculation
					closedSamplesRef.current.push({
						timestamp: Date.now(),
						closed: eyesClosed,
					});

					// Limit samples for memory management
					if (
						closedSamplesRef.current.length >
						EYE_TRACKING_CONSTANTS.PERCLOS.SAMPLES_LIMIT
					) {
						closedSamplesRef.current = closedSamplesRef.current.slice(
							-EYE_TRACKING_CONSTANTS.PERCLOS.SAMPLES_LIMIT
						);
					}

					// Calculate dark circle score (skip occasionally for performance)
					if (frameCountRef.current % 8 === 0) {
						try {
							const toPixelCoordinates = (point: any) => ({
								x: point.x * canvas.width,
								y: point.y * canvas.height,
							});

							const leftEye = {
								inner: toPixelCoordinates(landmarks[133]),
								outer: toPixelCoordinates(landmarks[33]),
								top: toPixelCoordinates(landmarks[159]),
								bottom: toPixelCoordinates(landmarks[145]),
							};

							const rightEye = {
								inner: toPixelCoordinates(landmarks[362]),
								outer: toPixelCoordinates(landmarks[263]),
								top: toPixelCoordinates(landmarks[386]),
								bottom: toPixelCoordinates(landmarks[374]),
							};

							const leftRectangles = getUnderEyeAndReferenceRectangles(
								leftEye as EyeKeypoints
							);
							const rightRectangles = getUnderEyeAndReferenceRectangles(
								rightEye as EyeKeypoints
							);

							const leftUnderEyeLuminance = calculateMeanLuminance(
								context,
								leftRectangles.underEye.x,
								leftRectangles.underEye.y,
								leftRectangles.underEye.width,
								leftRectangles.underEye.height
							);

							const rightUnderEyeLuminance = calculateMeanLuminance(
								context,
								rightRectangles.underEye.x,
								rightRectangles.underEye.y,
								rightRectangles.underEye.width,
								rightRectangles.underEye.height
							);

							const leftCheekLuminance = calculateMeanLuminance(
								context,
								leftRectangles.cheek.x,
								leftRectangles.cheek.y,
								leftRectangles.cheek.width,
								leftRectangles.cheek.height
							);

							const rightCheekLuminance = calculateMeanLuminance(
								context,
								rightRectangles.cheek.x,
								rightRectangles.cheek.y,
								rightRectangles.cheek.width,
								rightRectangles.cheek.height
							);

							const averageUnderEyeLuminance =
								(leftUnderEyeLuminance + rightUnderEyeLuminance) / 2;
							const averageCheekLuminance =
								(leftCheekLuminance + rightCheekLuminance) / 2;
							const relativeDifference =
								(averageCheekLuminance - averageUnderEyeLuminance) /
								Math.max(averageCheekLuminance, 1);

							darkCircleScoreRef.current = clamp01(
								(relativeDifference -
									EYE_TRACKING_CONSTANTS.METRICS.DARK_CIRCLE.SUBTRACT) /
									EYE_TRACKING_CONSTANTS.METRICS.DARK_CIRCLE.DIVIDE
							);
						} catch (error) {
							// Ignore ROI calculation errors
						}
					}

					// Detect blinks
					if (eyesClosed && !previousEyesClosedRef.current) {
						blinkTimestampsRef.current.push(Date.now());
					}

					if (eyesClosed) closedFramesRef.current += 1;
					previousEyesClosedRef.current = eyesClosed;
				}

				context.restore();
			} catch (error) {
				console.error('Error in render frame:', error);
			} finally {
				isProcessingRef.current = false;
			}

			animationFrameIdRef.current = requestAnimationFrame(renderFrame);
		},
		[drawEyes, drawIris, drawingColors, calculateLandmarkDistance, blinkDetectionThreshold]
	);

	const startTracking = useCallback(async () => {
		console.log('[useEyeTracking] Starting optimized tracking');
		if (loading) return;

		setLoading(true);

		try {
			if (!faceLandmarkerRef.current) {
				const initialized = await initializeFaceLandmarker();
				if (!initialized) throw new Error('Face landmarker initialization failed');
			}

			const stream = await startCamera();
			if (!stream) throw new Error('Camera start failed');

			setCameraState({ isCameraActive: true, cameraError: null });

			// Start the optimized rendering loop
			lastFrameTimeRef.current = performance.now();
			animationFrameIdRef.current = requestAnimationFrame(renderFrame);

			// Set up metrics intervals
			metricsIntervalIdRef.current = window.setInterval(
				updateAllMetrics,
				metricsUpdateInterval
			);

			setTrackingState({ isTrackingActive: true, trackingError: null });
			startSession();

			console.log('Tracking started successfully with background support');
		} catch (error) {
			console.error('Tracking error:', error);
			setTrackingState({
				isTrackingActive: false,
				trackingError: EYE_TRACKING_CONSTANTS.ERROR.TRACKING,
			});
			endSession();
		} finally {
			setLoading(false);
			setIsInitialized(true);
		}
	}, [
		loading,
		setLoading,
		startCamera,
		setCameraState,
		updateAllMetrics,
		metricsUpdateInterval,
		setTrackingState,
		startSession,
		initializeFaceLandmarker,
		renderFrame,
		endSession,
	]);

	const stopTracking = useCallback(() => {
		console.log('[useEyeTracking] Stopping tracking');

		// Clean up animation frame
		if (animationFrameIdRef.current != null) {
			cancelAnimationFrame(animationFrameIdRef.current);
			animationFrameIdRef.current = null;
		}

		// Clean up intervals
		if (metricsIntervalIdRef.current != null) {
			clearInterval(metricsIntervalIdRef.current);
			metricsIntervalIdRef.current = null;
		}

		if (blinkIntervalIdRef.current != null) {
			clearInterval(blinkIntervalIdRef.current);
			blinkIntervalIdRef.current = null;
		}

		stopCamera();
		setTrackingState({ isTrackingActive: false, trackingError: null });
		endSession();

		console.log('Tracking stopped completely');
	}, [endSession, setTrackingState, stopCamera]);

	const getMetricsHistory = () => {
		return metricsHistory;
	};

	const getStreamData = useCallback(() => {
		return streamDataRef.current;
	}, []);

	const updateDrawingOptions = useCallback((newOptions: Partial<EyeTrackingOptions>) => {
		console.log('Drawing options updated. Restart tracking to apply changes.', newOptions);
	}, []);

	return {
		videoRef,
		canvasRef,
		metrics: currentMetrics,
		isActive: isTrackingActive,
		cameraReady: isCameraActive,
		streamData: streamDataRef.current,
		loading,
		startTracking,
		stopTracking,
		getMetricsHistory,
		getStreamData,
		isInitialized,
		drawingColors,
		updateDrawingOptions,
		colorSchemes: COLOR_SCHEMES,
		stream: mediaStream,
	};
};
