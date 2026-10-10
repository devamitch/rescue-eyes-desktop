import { COLOR_SCHEMES, EYE_TRACKING_CONSTANTS } from '@/constants/eye-tracking';
import useAppStore from '@/store';
import { DrawingUtils, FaceLandmarker, FilesetResolver } from '@/utils/mediapipe';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBackgroundTracking } from './useBackgroundTracking';
// Type definitions remain the same
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

type Pt = { x: number; y: number };

const clamp02 = (v: number) => Math.max(0, Math.min(EYE_TRACKING_CONSTANTS.VISUAL.CLAMP_ONE, v));
const distPt = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

function safeRect(x: number, y: number, w: number, h: number, cw: number, ch: number) {
	const rx = Math.max(0, Math.min(cw - 1, Math.round(x)));
	const ry = Math.max(0, Math.min(ch - 1, Math.round(y)));
	const rw = Math.max(1, Math.min(cw - rx, Math.round(w)));
	const rh = Math.max(1, Math.min(ch - ry, Math.round(h)));
	return { x: rx, y: ry, w: rw, h: rh };
}

function meanLumaInRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number
): number {
	const { canvas } = ctx;
	const r = safeRect(x, y, w, h, canvas.width, canvas.height);
	const img = ctx.getImageData(r.x, r.y, r.w, r.h);
	const data = img.data;
	let sum = 0,
		n = 0;
	for (let i = 0; i < data.length; i += 4) {
		const r = data[i],
			g = data[i + 1],
			b = data[i + 2];
		sum +=
			EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.RED * r +
			EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.GREEN * g +
			EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.BLUE * b;
		n++;
	}
	return n ? sum / n : 0;
}

type EyeKeypoints2 = { inner: Pt; outer: Pt; top: Pt; bottom: Pt };

function underEyeAndRefRects(eye: EyeKeypoints) {
	const w = distPt(eye.inner, eye.outer);
	const cx = (eye.inner.x + eye.outer.x) * 0.5;
	const underW = EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.WIDTH_MULTIPLIER * w,
		underH = EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.HEIGHT_MULTIPLIER * w,
		underX = cx - underW / 2;
	const underY = eye.bottom.y + EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.Y_OFFSET * w;
	const cheekW = EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.WIDTH_MULTIPLIER * underW,
		cheekH = EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.HEIGHT_MULTIPLIER * underH,
		cheekX = cx - cheekW / 2;
	const cheekY = underY + underH + EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.Y_OFFSET * w;
	const foreheadW = EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.WIDTH_MULTIPLIER * underW,
		foreheadH = EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.HEIGHT_MULTIPLIER * underH,
		foreheadX = cx - foreheadW / 2;

	const foreheadY = eye.top.y - EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.Y_OFFSET * w - foreheadH;

	return {
		under: { x: underX, y: underY, w: underW, h: underH },
		cheek: { x: cheekX, y: cheekY, w: cheekW, h: cheekH },
		forehead: { x: foreheadX, y: foreheadY, w: foreheadW, h: foreheadH },
	};
}

function blinkPenaltyAbs(bpm: number) {
	return clamp01(
		Math.abs(bpm - EYE_TRACKING_CONSTANTS.BLINK.TARGET_PER_MIN) /
			EYE_TRACKING_CONSTANTS.BLINK.PENALTY_DIVISOR
	);
}

function perclosNorm(p: number) {
	return clamp01(
		(p - EYE_TRACKING_CONSTANTS.METRICS.PERCLOS_NORMALIZATION.SUBTRACT) /
			EYE_TRACKING_CONSTANTS.METRICS.PERCLOS_NORMALIZATION.DIVIDE
	);
}

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

	// Refs
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
	const drawingUtilsRef = useRef<DrawingUtils | null>(null);
	const animationFrameIdRef = useRef<number | null>(null);
	const metricsIntervalIdRef = useRef<number | null>(null);
	const blinkIntervalIdRef = useRef<number | null>(null);
	const intervalI2dRef = useRef<number | null>(null);

	const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

	const totalFramesRef = useRef(0);
	const closedFramesRef = useRef(0);
	const facePresentFramesRef = useRef(0);
	const previousEyesClosedRef = useRef(false);
	const closedSamplesRef = useRef<Array<{ timestamp: number; closed: boolean }>>([]);
	const darkCircleScoreRef = useRef(0);
	const streamDataRef = useRef<any[]>([]);
	const blinkTimestampsRef = useRef<number[]>([]);

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

	const { acquireWakeLock, releaseWakeLock, keepMediaAlive, stopMediaKeepAlive } =
		useBackgroundTracking();

	// Options with defaults
	const {
		colorScheme = 'minimal',
		colors = {},
		// drawFaceMesh = true,
		drawFaceMesh = false,
		drawEyes = true,
		drawIris = true,
		drawEyebrows = false,
		drawLips = false,
		drawFaceOval = false,
		metricsUpdateInterval = EYE_TRACKING_CONSTANTS.METRICS.UPDATE_INTERVAL,
		blinkDetectionThreshold = EYE_TRACKING_CONSTANTS.BLINK.DETECTION_THRESHOLD,
		videoConstraints = {
			width: { ideal: 640 },
			height: { ideal: 480 },
			focusMode: 'continuous',
			frameRate: { ideal: 1.7 },
		},
	} = options;

	const drawingColors: DrawingColors = useMemo(
		() => ({ ...COLOR_SCHEMES[colorScheme], ...colors }),
		[colorScheme, colors]
	);

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
		if (blinkRate < 12) {
			strainText = strainLevels.high;
		} else if (blinkRate < 18) {
			strainText = strainLevels.moderate;
		} else {
			strainText = strainLevels.low;
		}

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

	const startCamera = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: videoConstraints,
				audio: false,
			});

			stream.getTracks().forEach((track) => {
				track.enabled = true;
				// Keep alive in background
				setInterval(() => {
					if (track.readyState === 'live') {
						track.enabled = true;
					}
				}, 1000);
			});

			setMediaStream(stream);

			if (!videoRef.current) return null;

			videoRef.current.srcObject = stream;

			await new Promise<void>((resolve) => {
				if (!videoRef.current) return resolve();
				videoRef.current.onloadedmetadata = () => resolve();
			});

			acquireWakeLock();
			await videoRef.current.play();
			return stream;
		} catch (error) {
			console.error('Camera error:', error);
			setCameraState({
				isCameraActive: false,
				cameraError: EYE_TRACKING_CONSTANTS.ERROR.CAMERA,
			});
			return null;
		}
	}, [setCameraState, videoConstraints, acquireWakeLock]);

	const stopCamera = useCallback(() => {
		const stream = (videoRef.current?.srcObject as MediaStream) || null;
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
		releaseWakeLock();
		stopMediaKeepAlive();
	}, [releaseWakeLock, stopMediaKeepAlive]);

	useEffect(() => {
		if (mediaStream) {
			keepMediaAlive(mediaStream);
		} else {
			stopMediaKeepAlive();
		}
	}, [keepMediaAlive, stopMediaKeepAlive, mediaStream]);

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

	const blinkMetrics = useCallback(() => {
		const now = Date.now();
		const oneMinuteAgo = now - EYE_TRACKING_CONSTANTS.BLINK.WINDOW_MS;
		blinkTimestampsRef.current = blinkTimestampsRef.current.filter((t) => t > oneMinuteAgo);
		const raw = blinkTimestampsRef.current.length;
		const blinkRate = raw === 0 ? lastValidBlinkRateRef.current : raw;
		if (raw !== 0) lastValidBlinkRateRef.current = blinkRate;

		closedSamplesRef.current = closedSamplesRef.current.filter(
			(s) => s.t > now - EYE_TRACKING_CONSTANTS.PERCLOS.WINDOW_MS
		);
		let perclos = 0;
		if (closedSamplesRef.current.length > 1) {
			let closedMs = 0;
			const arr = closedSamplesRef.current;
			for (let i = 0; i < arr.length - 1; i++) {
				const dt = arr[i + 1].t - arr[i].t;
				if (arr[i].closed) closedMs += dt;
			}
			const totalMs = arr[arr.length - 1].t - arr[0].t;
			perclos = totalMs > 0 ? closedMs / totalMs : 0;
		}

		const perClose =
			totalFramesRef.current > 0
				? (closedFramesRef.current / totalFramesRef.current) * 100
				: 0;
		const attentionFrac =
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
		if (blinkRate < 12) {
			strainText = strainLevels.high;
		} else if (blinkRate < 18) {
			strainText = strainLevels.moderate;
		} else {
			strainText = strainLevels.low;
		}

		// Determine tired text based on perClose
		let tiredText: string;
		if (perClose > EYE_TRACKING_CONSTANTS.PERCENTAGE.PERCLOS_THRESHOLDS.VERY_HIGH) {
			tiredText = strainLevels.veryHigh;
		} else if (perClose > EYE_TRACKING_CONSTANTS.PERCENTAGE.PERCLOS_THRESHOLDS.HIGH) {
			tiredText = strainLevels.high;
		} else if (perClose > EYE_TRACKING_CONSTANTS.PERCENTAGE.PERCLOS_THRESHOLDS.MODERATE) {
			tiredText = strainLevels.moderate;
		} else {
			tiredText = strainLevels.low;
		}

		const bp = blinkPenaltyAbs(blinkRate);
		const dark = darkCircleScoreRef.current;

		const eyeAge = calculateEyeAge(blinkRate, perclos, dark);
		const squint =
			perClose > 15
				? EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.HIGH.MIN +
					Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.HIGH.RANGE
				: EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.LOW.MIN +
					Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.LOW.RANGE;

		const metrics = {
			blinkRate,
		};

		streamDataRef.current = [
			...streamDataRef.current.slice(-EYE_TRACKING_CONSTANTS.METRICS.HISTORY_LIMIT),
			metrics,
		];
		updateStoreMetrics(metrics);
		closedFramesRef.current = 0;
	}, [updateStoreMetrics, t, calculateEyeAge]);

	const startTracking = useCallback(async () => {
		console.log('[useEyeTracking] Starting tracking');
		if (loading) return;

		setLoading(true);
		const isCancelled = false;

		try {
			if (!faceLandmarkerRef.current) {
				const initialized = await initializeFaceLandmarker();
				if (!initialized) throw new Error('Face landmarker initialization failed');
			}

			await startCamera();
			setCameraState({ isCameraActive: true, cameraError: null });

			const renderFrame = async () => {
				if (isCancelled) return;

				const video = videoRef.current;
				const canvas = canvasRef.current;
				const faceLandmarker = faceLandmarkerRef.current;

				if (
					video &&
					canvas &&
					faceLandmarker &&
					video.readyState === video.HAVE_ENOUGH_DATA
				) {
					const context = canvas.getContext('2d');
					if (!context) return;

					// Update canvas dimensions if needed
					if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
						canvas.width = video.videoWidth;
						canvas.height = video.videoHeight;
						drawingUtilsRef.current = new DrawingUtils(context);
					}

					const currentTime = performance.now();
					const results = faceLandmarker.detectForVideo(video, currentTime);

					context.save();
					context.clearRect(0, 0, canvas.width, canvas.height);
					context.drawImage(video, 0, 0, canvas.width, canvas.height);
					totalFramesRef.current += 1;

					if (results.faceLandmarks && results.faceLandmarks.length > 0) {
						const landmarks = results.faceLandmarks[0];
						facePresentFramesRef.current += 1;

						// Draw face landmarks
						const drawingUtils = drawingUtilsRef.current!;
						if (drawFaceMesh) {
							drawingUtils.drawConnectors(
								landmarks,
								FaceLandmarker.FACE_LANDMARKS_TESSELATION,
								{
									color: drawingColors.faceMesh,
									lineWidth: 1,
								}
							);
						}

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
						const leftHorizontal = calculateLandmarkDistance(
							landmarks[33],
							landmarks[133]
						);
						const leftVertical = calculateLandmarkDistance(
							landmarks[159],
							landmarks[145]
						);
						const rightHorizontal = calculateLandmarkDistance(
							landmarks[362],
							landmarks[263]
						);
						const rightVertical = calculateLandmarkDistance(
							landmarks[386],
							landmarks[374]
						);

						const leftRatio = leftVertical > 0 ? leftHorizontal / leftVertical : 0;
						const rightRatio = rightVertical > 0 ? rightHorizontal / rightVertical : 0;
						const averageRatio = (leftRatio + rightRatio) / 2;

						const eyesClosed = averageRatio > blinkDetectionThreshold;

						// Track closed samples for PERCLOS calculation
						closedSamplesRef.current.push({
							timestamp: Date.now(),
							closed: eyesClosed,
						});

						if (
							closedSamplesRef.current.length >
							EYE_TRACKING_CONSTANTS.PERCLOS.SAMPLES_LIMIT
						) {
							const keepAfterTimestamp =
								Date.now() -
								EYE_TRACKING_CONSTANTS.PERCLOS.WINDOW_MS *
									EYE_TRACKING_CONSTANTS.PERCLOS.WINDOW_MULTIPLIER;
							closedSamplesRef.current = closedSamplesRef.current.filter(
								(sample) => sample.timestamp > keepAfterTimestamp
							);
						}

						// Calculate dark circle score
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
							console.debug('ROI calculation error:', error);
						}

						// Detect blinks
						if (eyesClosed && !previousEyesClosedRef.current) {
							blinkTimestampsRef.current.push(Date.now());
						}

						if (eyesClosed) closedFramesRef.current += 1;
						previousEyesClosedRef.current = eyesClosed;
					}

					context.restore();
				}

				if (!isCancelled) {
					animationFrameIdRef.current = requestAnimationFrame(renderFrame);
				}
			};

			// Start the rendering loop
			renderFrame();

			// Set up metrics intervals
			metricsIntervalIdRef.current = window.setInterval(
				updateAllMetrics,
				metricsUpdateInterval
			);

			blinkIntervalIdRef.current = window.setInterval(
				blinkMetrics,
				options.metricsUpdateInterval ??
					EYE_TRACKING_CONSTANTS.METRICS.UPDATE_BLINK_INTERVAL
			);

			setTrackingState({ isTrackingActive: true, trackingError: null });
			startSession();
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
		blinkDetectionThreshold,
		setTrackingState,
		startSession,
		initializeFaceLandmarker,
		drawingColors,
		calculateLandmarkDistance,
		endSession,
		drawFaceMesh,
		drawEyes,
		drawIris,
		blinkMetrics,
	]);

	const stopTracking = useCallback(() => {
		// Clean up animation frame
		if (animationFrameIdRef.current != null) {
			cancelAnimationFrame(animationFrameIdRef.current);
		}

		// Clean up intervals
		if (metricsIntervalIdRef.current != null) {
			clearInterval(metricsIntervalIdRef.current);
		}

		if (blinkIntervalIdRef.current != null) {
			clearInterval(blinkIntervalIdRef.current);
		}

		stopCamera();
		setTrackingState({ isTrackingActive: false, trackingError: null });
		endSession();
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