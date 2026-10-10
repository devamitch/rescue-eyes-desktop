export interface FaceLandmarks {
	x: number;
	y: number;
	z?: number;
	visibility?: number;
}

export interface MediaPipeResults {
	faceLandmarks?: FaceLandmarks[][];
	faceBlendshapes?: Array<{
		categories: Array<{ categoryName: string; score: number }>;
	}>;
}

export interface EyeTrackingMetrics {
	timestamp: string;
	blinkRate: number;
	eyeStrain: number;
	attentionLevel: number;
	tiredness: number;
	perclos: number;
	attentionFrac: number;
	strainLevelIdx: 0 | 1 | 2;
	strainText: 'Low' | 'Moderate' | 'High';
	tiredText: 'Low' | 'Moderate' | 'High' | 'Very High';
	attBinary: 0 | 1;
	eyeAspectRatio: number;
	facePresent: boolean;
}

export interface HistoryData {
	hourly: EyeTrackingMetrics[];
	daily: EyeTrackingMetrics[];
	monthly: EyeTrackingMetrics[];
	yearly: EyeTrackingMetrics[];
}

export interface UserProfile {
	name: string;
	age: number;
	eyeAge: number;
	totalSessions: number;
	createdAt: string;
	lastActive: string;
}

export interface CameraConfig {
	width?: number;
	height?: number;
	facingMode?: 'user' | 'environment';
	frameRate?: number;
}

export type Point = { x: number; y: number };

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

export type EyeKeypoints = {
	inner: Point;
	outer: Point;
	top: Point;
	bottom: Point;
};

export type Rectangle = {
	x: number;
	y: number;
	w: number;
	h: number;
};

export type UnderEyeRegions = {
	under: Rectangle;
	cheek: Rectangle;
	forehead: Rectangle;
};

export type EyeTrackingConfig = {
	metricsUpdateInterval?: number;
	blinkDetectionThreshold?: number;
	videoConstraints?: MediaTrackConstraints;
	enableGPU?: boolean;
	maxFaces?: number;
	enableDarkCircleDetection?: boolean;
};

export type StreamAnalysisResult = {
	metrics: EyeMetrics;
	landmarks?: any[];
	debugInfo?: {
		totalFrames: number;
		closedFrames: number;
		facePresentFrames: number;
		blinkTimestamps: number[];
	};
};

export interface EyeTrackingModelInterface {
	initialize(): Promise<boolean>;
	analyzeStream(videoElement: HTMLVideoElement): Promise<StreamAnalysisResult | null>;
	dispose(): void;
	isInitialized(): boolean;
}

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

export type EyeMetricsq = {
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
	aiProcessedData?: any; // Added for secure AI processing
};

export type DrawingColorsq = {
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

export type ColorSchemeq = 'default' | 'minimal';

export type EyeTrackingOptionsq = {
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
	useSecureAI?: boolean; // Added for secure AI processing
};

export type Pt = { x: number; y: number };
export type EyeKeypointsq = { inner: Pt; outer: Pt; top: Pt; bottom: Pt };

// types/eye-tracking.constants.ts
export interface BlinkConstants {
	WINDOW_MS: number;
	TARGET_PER_MIN: number;
	DETECTION_THRESHOLD: number;
	PENALTY_DIVISOR: number;
}

export interface PerclosConstants {
	WINDOW_MS: number;
	SAMPLES_LIMIT: number;
	WINDOW_MULTIPLIER: number;
}

export interface AgeConstants {
	MIN_EYE: number;
	MAX_EYE: number;
	MIN_FACE: number;
	MAX_FACE: number;
	ABSOLUTE_MAX: number;
	FACE_ATTENTION_IMPACT: number;
}

export interface NormalizationConstants {
	SUBTRACT: number;
	DIVIDE: number;
}

export interface WeightsConstants {
	PERCLOS: number;
	DARK: number;
	BLINK: number;
}

export interface MetricsConstants {
	UPDATE_INTERVAL: number;
	UPDATE_BLINK_INTERVAL: number;
	HISTORY_LIMIT: number;
	PERCLOS_NORMALIZATION: NormalizationConstants;
	DARK_CIRCLE: NormalizationConstants;
	TIREDNESS_WEIGHTS: WeightsConstants;
	EYE_AGE_WEIGHTS: WeightsConstants;
}

export interface RectMultipliers {
	WIDTH_MULTIPLIER: number;
	HEIGHT_MULTIPLIER: number;
	Y_OFFSET: number;
}

export interface LuminanceWeights {
	RED: number;
	GREEN: number;
	BLUE: number;
}

export interface VisualConstants {
	CLAMP_ONE: number;
	UNDER_EYE: RectMultipliers;
	CHEEK: RectMultipliers;
	FOREHEAD: RectMultipliers;
	LUMINANCE_WEIGHTS: LuminanceWeights;
}

export interface FallbackConstants {
	BLINK_RATE: number;
	EYE_AGE: number;
	FACE_AGE: number;
}

export interface PerclosThresholds {
	VERY_HIGH: number;
	HIGH: number;
	MODERATE: number;
}

export interface PercentageConstants {
	ATTENTION_THRESHOLD: number;
	PERCLOS_THRESHOLDS: PerclosThresholds;
}

export interface RangeValues {
	MIN: number;
	RANGE: number;
}

export interface SquintConstants {
	HIGH: RangeValues;
	LOW: RangeValues;
}

export interface PupilConstants {
	BASE: number;
	PERCLOS_FACTOR: number;
	RANGE: number;
	MIN: number;
}

export interface EyeAspectConstants {
	BASE: number;
	BLINK_FACTOR: number;
	RANGE: number;
}

export interface RandomConstants {
	SQUINT: SquintConstants;
	PUPIL: PupilConstants;
	EYE_ASPECT: EyeAspectConstants;
}

export interface PathConfig {
	WASM: string;
	MODEL: string;
}

export interface PathsConstants {
	MEDIAPIPE: PathConfig;
	FALLBACK: PathConfig;
}

export interface ErrorConstants {
	CAMERA: string;
	INIT: string;
	TRACKING: string;
}

export interface EyeTrackingConstants {
	BLINK: BlinkConstants;
	PERCLOS: PerclosConstants;
	AGE: AgeConstants;
	METRICS: MetricsConstants;
	VISUAL: VisualConstants;
	FALLBACK: FallbackConstants;
	PERCENTAGE: PercentageConstants;
	RANDOM: RandomConstants;
	PATHS: PathsConstants;
	ERROR: ErrorConstants;
}

// Optional: Create a deep readonly version for extra safety
export type ReadonlyEyeTrackingConstants = {
	readonly [K in keyof EyeTrackingConstants]: {
		readonly [P in keyof EyeTrackingConstants[K]]: EyeTrackingConstants[K][P] extends object
			? { readonly [Q in keyof EyeTrackingConstants[K][P]]: EyeTrackingConstants[K][P][Q] }
			: EyeTrackingConstants[K][P];
	};
};
