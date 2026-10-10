export const EYE_TRACKING_CONSTANTS = {
	// Time windows
	BLINK_WINDOW_MS: 60_000,
	PERCLOS_WINDOW_MS: 60_000,

	// Thresholds
	TARGET_BLINKS_PER_MIN: 18,
	DEFAULT_BLINK_DETECTION_THRESHOLD: 6.0,

	// Age ranges
	MIN_EYE_AGE_YRS: 18,
	MAX_EYE_AGE_YRS: 75,

	// Update intervals
	DEFAULT_METRICS_UPDATE_INTERVAL: 500,

	// Video constraints
	DEFAULT_VIDEO_CONSTRAINTS: {
		width: { ideal: 640 },
		height: { ideal: 480 },
		facingMode: 'user' as const,
		frameRate: { ideal: 30 },
	},

	// MediaPipe paths (configurable for security)
	MODEL_PATHS: {
		WASM_PATH: process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_PATH || '/mediapipe/wasm/',
		MODEL_PATH:
			process.env.NEXT_PUBLIC_FACE_LANDMARKER_PATH ||
			'/mediapipe/models/face_landmarker.task',
		FALLBACK_WASM: '@/utils/wasm',
		FALLBACK_MODEL: '@/utils/face_landmarker.task',
	},

	// Calculation constants
	LUMA_COEFFICIENTS: {
		R: 0.299,
		G: 0.587,
		B: 0.114,
	},

	// ROI calculations
	UNDER_EYE_MULTIPLIERS: {
		WIDTH: 1.1,
		HEIGHT: 0.45,
		Y_OFFSET: 0.12,
	},

	CHEEK_MULTIPLIERS: {
		WIDTH: 0.9,
		HEIGHT: 0.9,
		Y_OFFSET: 0.2,
	},

	FOREHEAD_MULTIPLIERS: {
		WIDTH: 0.9,
		HEIGHT: 0.6,
		Y_OFFSET: 0.8,
	},
} as const;

export const COLOR_SCHEMES = {
	default: {
		background: 'transparent',
		text: '#FFFFFF',
		highlight: '#FFD700',
		faceMesh: '#94AB9630',
		rightEye: '#94AB96',
		leftEye: '#94AB96',
		rightIris: '#94AB96',
		leftIris: '#94AB96',
		rightEyebrow: '#94AB96',
		leftEyebrow: '#94AB96',
		lips: '#94AB96',
		faceOval: '#94AB96',
	},
	minimal: {
		background: 'transparent',
		text: '#FFFFFF',
		highlight: '#FFD700',
		faceMesh: '#94AB9630',
		rightEye: '#94AB96',
		leftEye: '#94AB96',
		rightIris: '#94AB96',
		leftIris: '#94AB96',
		rightEyebrow: '#94AB96',
		leftEyebrow: '#94AB96',
		lips: '#94AB96',
		faceOval: '#94AB96',
	},
} as const;

// Landmark indices (MediaPipe specific)
export const LANDMARK_INDICES = {
	LEFT_EYE: {
		INNER_CORNER: 133,
		OUTER_CORNER: 33,
		TOP: 159,
		BOTTOM: 145,
	},
	RIGHT_EYE: {
		INNER_CORNER: 362,
		OUTER_CORNER: 263,
		TOP: 386,
		BOTTOM: 374,
	},
} as const;
