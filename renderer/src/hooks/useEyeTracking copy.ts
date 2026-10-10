import {
	COLOR_SCHEMES,
	EYE_TRACKING_CONSTANTS,
	MEAN_LUMA_FUNCTION_STRING,
} from '@/constants/eye-tracking';
import useAppStore from '@/store';
import { DrawingUtils, FaceLandmarker, FilesetResolver } from '@/utils/mediapipe';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef, useState } from 'react';

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

type Pt = { x: number; y: number };

const clamp01 = (v: number) => Math.max(0, Math.min(EYE_TRACKING_CONSTANTS.VISUAL.CLAMP_ONE, v));
const distPt = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

function safeRect(x: number, y: number, w: number, h: number, cw: number, ch: number) {
	const rx = Math.max(0, Math.min(cw - 1, Math.round(x)));
	const ry = Math.max(0, Math.min(ch - 1, Math.round(y)));
	const rw = Math.max(1, Math.min(cw - rx, Math.round(w)));
	const rh = Math.max(1, Math.min(ch - ry, Math.round(h)));
	return { x: rx, y: ry, w: rw, h: rh };
}

const functions = {
	meanLumaInRectSting: MEAN_LUMA_FUNCTION_STRING,
};

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

type EyeKeypoints = { inner: Pt; outer: Pt; top: Pt; bottom: Pt };

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
	const {
		camera: { isCameraActive = false, isTrackingActive = false, loading = false } = {},
		eyeTracking: { currentMetrics = null, metricsHistory = [] } = {},
		screenTime: { dailyScreenTime = 0 } = {},
		firebase: { authUser = null, isLoggedIn = false } = {},
	} = useAppStore?.() || {};

	// Getters with safe access and fallbacks
	const getLastBlinkRate = useAppStore?.(
		(state) => state?.eyeTracking?.getLastBlinkRate?.() || 0
	);
	const getLastMetrics =
		useAppStore?.((state) => state?.eyeTracking?.getLastMetrics?.()) || (() => 0);

	// Setters with safe access and fallbacks

	const setCameraState =
		useAppStore?.((state) => state?.camera?.setCameraState) ||
		(() => console.warn('setCameraState is not available'));

	const setTrackingState =
		useAppStore?.((state) => state?.camera?.setTrackingState) ||
		(() => console.warn('setTrackingState is not available'));

	const setLoading =
		useAppStore?.((state) => state?.camera?.setLoading) ||
		(() => console.warn('setLoading is not available'));

	const setAuthUser =
		useAppStore?.((state) => state?.firebase?.setAuthUser) ||
		(() => console.warn('setAuthUser is not available'));

	const setError =
		useAppStore?.((state) => state?.eyeTracking?.setError) ||
		(() => console.warn('setError is not available'));

	// Actions/Functions with safe access and fallbacks
	const startSession =
		useAppStore?.((state) => state?.eyeTracking?.startSession) ||
		(() => console.warn('startSession is not available'));

	const endSession =
		useAppStore?.((state) => state?.eyeTracking?.endSession) ||
		(() => console.warn('endSession is not available'));

	const updateStoreMetrics =
		useAppStore?.((state) => state?.eyeTracking?.updateMetrics) ||
		(() => console.warn('updateStoreMetrics is not available'));

	const startScreenTime =
		useAppStore?.((state) => state?.screenTime?.startScreenTime) ||
		(() => console.warn('startScreenTime is not available'));
	const t = useTranslations();

	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
	const drawingUtilsRef = useRef<DrawingUtils | null>(null);
	const rafIdRef = useRef<number | null>(null);
	const intervalIdRef = useRef<number | null>(null);
	const intervalI2dRef = useRef<number | null>(null);
	const [stream2, setStream2] = useState<MediaStream | null>(null);

	const totalFramesRef = useRef(0);
	const closedFramesRef = useRef(0);
	const facePresentFramesRef = useRef(0);
	const prevEyesClosedRef = useRef(false);
	const closedSamplesRef = useRef<Array<{ t: number; closed: boolean }>>([]);
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

	const {
		colorScheme = 'minimal',
		colors = {},
		drawFaceMesh = true,
		drawEyes = true,
		drawIris = true,
		drawEyebrows = true,
		drawLips = true,
		drawFaceOval = true,
		metricsUpdateInterval = EYE_TRACKING_CONSTANTS.METRICS.UPDATE_INTERVAL,
		blinkDetectionThreshold = EYE_TRACKING_CONSTANTS.BLINK.DETECTION_THRESHOLD,
		videoConstraints = {
			width: { ideal: 640 },
			height: { ideal: 480 },
			facingMode: 'user',
			frameRate: { ideal: 30 },
		},
	} = options;

	const drawingColors: DrawingColors = useMemo(
		() => ({ ...COLOR_SCHEMES[colorScheme], ...colors }),
		[colorScheme, colors]
	);

	const calculateEyeAge = useCallback((blinkRate: number, perclos: number, dark: number) => {
		if (blinkRate <= 0 || isNaN(blinkRate)) return lastValidEyeAgeRef.current;
		const bp = blinkPenaltyAbs(blinkRate);
		const idx = clamp01(
			EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.PERCLOS * perclosNorm(perclos) +
				EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.DARK * dark +
				EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.BLINK * bp
		);
		const yrs = Math.round(
			EYE_TRACKING_CONSTANTS.AGE.MIN_EYE +
				idx * (EYE_TRACKING_CONSTANTS.AGE.MAX_EYE - EYE_TRACKING_CONSTANTS.AGE.MIN_EYE)
		);
		if (yrs > 0 && yrs <= EYE_TRACKING_CONSTANTS.AGE.ABSOLUTE_MAX)
			lastValidEyeAgeRef.current = yrs;
		return yrs;
	}, []);

	const calculateFaceAge = useCallback(
		(eyeAge: number, attentionFrac: number, squint: number) => {
			let faceAge = eyeAge;
			faceAge += (1 - attentionFrac) * EYE_TRACKING_CONSTANTS.AGE.FACE_ATTENTION_IMPACT;
			faceAge += (squint - 15) / 5;
			const out = Math.max(
				EYE_TRACKING_CONSTANTS.AGE.MIN_FACE,
				Math.min(EYE_TRACKING_CONSTANTS.AGE.MAX_FACE, Math.round(faceAge))
			);
			if (out > 0 && out <= 100) lastValidFaceAgeRef.current = out;
			return out;
		},
		[]
	);

	const updateMetrics = useCallback(() => {
		const timestamp = new Date().toLocaleTimeString();
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
		const tiredness = clamp01(
			EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.PERCLOS * perclosNorm(perclos) +
				EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.DARK * dark +
				EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.BLINK * bp
		);
		const eyeAgeIdx = clamp01(
			EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.PERCLOS * perclosNorm(perclos) +
				EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.DARK * dark +
				EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.BLINK * bp
		);
		const eyeAge = calculateEyeAge(blinkRate, perclos, dark);
		const squint =
			perClose > 15
				? EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.HIGH.MIN +
					Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.HIGH.RANGE
				: EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.LOW.MIN +
					Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.LOW.RANGE;
		const faceAge = calculateFaceAge(eyeAge, attentionFrac, squint);

		const metrics: EyeMetrics = {
			timestamp,
			blinkRate,
			perClose,
			perclos,
			attentionFrac,
			strainLevelIdx: (blinkRate < 12 ? 2 : blinkRate < 18 ? 1 : 0) as 0 | 1 | 2,
			strainText,
			tiredText,
			attBinary:
				attentionFrac >= EYE_TRACKING_CONSTANTS.PERCENTAGE.ATTENTION_THRESHOLD ? 1 : 0,
			eyeAspectRatio:
				EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.BASE +
				blinkRate * EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.BLINK_FACTOR +
				Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.RANGE,
			pupilDilation: Math.max(
				EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.MIN,
				EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.BASE -
					perClose * EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.PERCLOS_FACTOR +
					Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.RANGE
			),
			squintIntensity: squint,
			darkCircleScore: dark,
			tirednessScore: tiredness,
			eyeAgeIndex: eyeAgeIdx,
			eyeAge,
			faceAge,
		};

		streamDataRef.current = [
			...streamDataRef.current.slice(-EYE_TRACKING_CONSTANTS.METRICS.HISTORY_LIMIT),
			metrics,
		];
		updateStoreMetrics(metrics);

		totalFramesRef.current = 0;
		closedFramesRef.current = 0;
		facePresentFramesRef.current = 0;
	}, [updateStoreMetrics, calculateEyeAge, calculateFaceAge, t]);

	const blinkMetrics = useCallback(() => {
		const timestamp = new Date().toLocaleTimeString();
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
		const tiredness = clamp01(
			EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.PERCLOS * perclosNorm(perclos) +
				EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.DARK * dark +
				EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.BLINK * bp
		);
		const eyeAgeIdx = clamp01(
			EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.PERCLOS * perclosNorm(perclos) +
				EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.DARK * dark +
				EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.BLINK * bp
		);
		const eyeAge = calculateEyeAge(blinkRate, perclos, dark);
		const squint =
			perClose > 15
				? EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.HIGH.MIN +
					Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.HIGH.RANGE
				: EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.LOW.MIN +
					Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.LOW.RANGE;
		const faceAge = calculateFaceAge(eyeAge, attentionFrac, squint);

		const metrics = {
			// timestamp,
			blinkRate,
			// perClose,
			// perclos,
			// attentionFrac,
			// strainLevelIdx: (blinkRate < 12 ? 2 : blinkRate < 18 ? 1 : 0) as 0 | 1 | 2,
			// strainText,
			// tiredText,
			// attBinary:
			// 	attentionFrac >= EYE_TRACKING_CONSTANTS.PERCENTAGE.ATTENTION_THRESHOLD ? 1 : 0,
			// eyeAspectRatio:
			// 	EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.BASE +
			// 	blinkRate * EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.BLINK_FACTOR +
			// 	Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.RANGE,
			// pupilDilation: Math.max(
			// 	EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.MIN,
			// 	EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.BASE -
			// 		perClose * EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.PERCLOS_FACTOR +
			// 		Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.RANGE
			// ),
			// squintIntensity: squint,
			// darkCircleScore: dark,
			// tirednessScore: tiredness,
			// eyeAgeIndex: eyeAgeIdx,
			// eyeAge,
			// faceAge,
		};

		streamDataRef.current = [
			...streamDataRef.current.slice(-EYE_TRACKING_CONSTANTS.METRICS.HISTORY_LIMIT),
			metrics,
		];
		updateStoreMetrics(metrics);

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
			setStream2(stream);
			if (!videoRef.current) return null;
			(videoRef.current as HTMLVideoElement).srcObject = stream;
			await new Promise<void>((res) => {
				if (!videoRef.current) return res();
				(videoRef.current as HTMLVideoElement).onloadedmetadata = () => res();
			});
			await (videoRef.current as HTMLVideoElement).play();
			return stream;
		} catch (e) {
			console.error('camera', e);
			setCameraState({
				isCameraActive: false,
				cameraError: EYE_TRACKING_CONSTANTS.ERROR.CAMERA,
			});
			return null;
		}
	}, [setCameraState, videoConstraints]);

	const stopCamera = useCallback(() => {
		const stream = (videoRef.current?.srcObject as MediaStream) || null;
		if (stream) stream.getTracks().forEach((t) => t.stop());
		if (videoRef.current) (videoRef.current as HTMLVideoElement).srcObject = null;
	}, []);

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
			} finally {
				setIsInitialized(true);
			}
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

	const calculateDistance = useCallback(
		(p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y),
		[]
	);

	const startTracking = useCallback(async () => {
		console.log('[useEyeTracking] startTracking');
		if (loading) return;
		setLoading(true);
		const cancelled = false;
		try {
			if (!faceLandmarkerRef.current) {
				const ok = await initializeFaceLandmarker();
				if (!ok) throw new Error('Face landmarker init failed');
			}
			await startCamera();
			setCameraState({ isCameraActive: true, cameraError: null });

			const renderLoop = async () => {
				if (cancelled) return;
				const video = videoRef.current as HTMLVideoElement | null;
				const canvas = canvasRef.current as HTMLCanvasElement | null;
				const faceLandmarker = faceLandmarkerRef.current;
				if (
					video &&
					canvas &&
					faceLandmarker &&
					video.readyState === video.HAVE_ENOUGH_DATA
				) {
					const ctx = canvas.getContext('2d');
					if (!ctx) return;
					if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
						canvas.width = video.videoWidth;
						canvas.height = video.videoHeight;
						drawingUtilsRef.current = new DrawingUtils(ctx);
					}
					const nowMs = performance.now();
					const results = faceLandmarker.detectForVideo(video, nowMs);
					ctx.save();
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
					totalFramesRef.current += 1;

					if (results.faceLandmarks && results.faceLandmarks.length > 0) {
						const landmarks = results.faceLandmarks[0];
						facePresentFramesRef.current += 1;
						// (overlay drawn after ROI sampling)
						const du = drawingUtilsRef.current!;
						du.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
							color: drawingColors.faceMesh,
							lineWidth: 1,
						});
						du.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
							color: drawingColors.rightEye,
							lineWidth: 1,
						});
						du.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
							color: drawingColors.leftEye,
							lineWidth: 1,
						});
						du.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, {
							color: drawingColors.rightEyebrow,
							lineWidth: 1,
						});
						du.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, {
							color: drawingColors.leftEyebrow,
							lineWidth: 1,
						});

						const leftH = calculateDistance(landmarks[33], landmarks[133]);
						const leftV = calculateDistance(landmarks[159], landmarks[145]);
						const rightH = calculateDistance(landmarks[362], landmarks[263]);
						const rightV = calculateDistance(landmarks[386], landmarks[374]);
						const leftR = leftV > 0 ? leftH / leftV : 0;
						const rightR = rightV > 0 ? rightH / rightV : 0;
						const avgR = (leftR + rightR) / 2;
						const eyesClosed =
							avgR >
							(options.blinkDetectionThreshold ??
								EYE_TRACKING_CONSTANTS.BLINK.DETECTION_THRESHOLD);

						closedSamplesRef.current.push({ t: Date.now(), closed: eyesClosed });
						if (
							closedSamplesRef.current.length >
							EYE_TRACKING_CONSTANTS.PERCLOS.SAMPLES_LIMIT
						) {
							const keepAfter =
								Date.now() -
								EYE_TRACKING_CONSTANTS.PERCLOS.WINDOW_MS *
									EYE_TRACKING_CONSTANTS.PERCLOS.WINDOW_MULTIPLIER;
							closedSamplesRef.current = closedSamplesRef.current.filter(
								(s) => s.t > keepAfter
							);
						}

						try {
							const toPx = (p: any) => ({
								x: p.x * canvas.width,
								y: p.y * canvas.height,
							});
							const L = {
								inner: toPx(landmarks[133]),
								outer: toPx(landmarks[33]),
								top: toPx(landmarks[159]),
								bottom: toPx(landmarks[145]),
							};
							const R = {
								inner: toPx(landmarks[362]),
								outer: toPx(landmarks[263]),
								top: toPx(landmarks[386]),
								bottom: toPx(landmarks[374]),
							};
							const rL = underEyeAndRefRects(L as any);
							const rR = underEyeAndRefRects(R as any);
							const underL = meanLumaInRect(
								ctx,
								rL.under.x,
								rL.under.y,
								rL.under.w,
								rL.under.h
							);
							const underR = meanLumaInRect(
								ctx,
								rR.under.x,
								rR.under.y,
								rR.under.w,
								rR.under.h
							);
							const refL = meanLumaInRect(
								ctx,
								rL.cheek.x,
								rL.cheek.y,
								rL.cheek.w,
								rL.cheek.h
							);
							const refR = meanLumaInRect(
								ctx,
								rR.cheek.x,
								rR.cheek.y,
								rR.cheek.w,
								rR.cheek.h
							);
							const underAvg = (underL + underR) / 2;
							const refAvg = (refL + refR) / 2;
							const rel = (refAvg - underAvg) / Math.max(refAvg, 1);
							darkCircleScoreRef.current = clamp01(
								(rel - EYE_TRACKING_CONSTANTS.METRICS.DARK_CIRCLE.SUBTRACT) /
									EYE_TRACKING_CONSTANTS.METRICS.DARK_CIRCLE.DIVIDE
							);
						} catch {
							/* ignore ROI errors */
						}

						if (eyesClosed && !prevEyesClosedRef.current) {
							blinkTimestampsRef.current.push(Date.now());
						}
						if (eyesClosed) closedFramesRef.current += 1;
						prevEyesClosedRef.current = eyesClosed;
					}
					ctx.restore();
				}
				if (!cancelled) rafIdRef.current = requestAnimationFrame(renderLoop);
			};
			renderLoop();
			intervalIdRef.current = window.setInterval(
				updateMetrics,
				options.metricsUpdateInterval ?? EYE_TRACKING_CONSTANTS.METRICS.UPDATE_INTERVAL
			);
			intervalI2dRef.current = window.setInterval(
				blinkMetrics,
				options.metricsUpdateInterval ??
					EYE_TRACKING_CONSTANTS.METRICS.UPDATE_BLINK_INTERVAL
			);
			setTrackingState({ isTrackingActive: true, trackingError: null });
			startSession();
		} catch (e) {
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
		updateMetrics,
		options.metricsUpdateInterval,
		options.blinkDetectionThreshold,
		blinkMetrics,
		setTrackingState,
		startSession,
		initializeFaceLandmarker,
		drawingColors.faceMesh,
		drawingColors.rightEye,
		drawingColors.leftEye,
		drawingColors.rightEyebrow,
		drawingColors.leftEyebrow,
		calculateDistance,
		endSession,
	]);

	const stopTracking = useCallback(() => {
		if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current as number);
		if (intervalIdRef.current != null) clearInterval(intervalIdRef.current as number);
		if (intervalI2dRef.current != null) clearInterval(intervalI2dRef.current as number);
		stopCamera();
		setTrackingState({ isTrackingActive: false, trackingError: null });
		endSession();
	}, [endSession, setTrackingState, stopCamera]);
	const getMetricsHistory = useCallback(() => {
		return metricsHistory;
	}, [metricsHistory]);

	const getStreamData = useCallback(() => {
		return streamDataRef.current;
	}, []);

	const updateDrawingOptions = useCallback((newOptions: Partial<EyeTrackingOptions>) => {
		// This would typically be implemented with state management
		// For now, we'll need to restart tracking with new options
		console.log('Options updated. Restart tracking to apply changes.', newOptions);
	}, []);

	return {
		videoRef,
		canvasRef,
		metrics: currentMetrics,
		// error: cameraError || trackingError,
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
		stream: stream2,
	};
};
