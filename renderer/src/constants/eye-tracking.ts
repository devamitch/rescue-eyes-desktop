import { ReadonlyEyeTrackingConstants } from '@/types/eye-tracking';
import { decrypt } from '@/utils/encryption';
import { ENCRYPTED_EYE_TRACKING } from './env';

export const EYE_TRACKING_CONSTANTS_RAW: ReadonlyEyeTrackingConstants = {
	BLINK: {
		WINDOW_MS: 60000,
		TARGET_PER_MIN: 18,
		DETECTION_THRESHOLD: 6.0,
		PENALTY_DIVISOR: 12,
	},
	PERCLOS: {
		WINDOW_MS: 60000,
		SAMPLES_LIMIT: 1500,
		WINDOW_MULTIPLIER: 2,
	},
	AGE: {
		MIN_EYE: 0,
		MAX_EYE: 100,
		MIN_FACE: 0,
		MAX_FACE: 180,
		ABSOLUTE_MAX: 120,
		FACE_ATTENTION_IMPACT: 5,
	},
	METRICS: {
		UPDATE_INTERVAL: 6000,
		UPDATE_BLINK_INTERVAL: 500,
		HISTORY_LIMIT: 49,
		PERCLOS_NORMALIZATION: {
			SUBTRACT: 0.1,
			DIVIDE: 0.3,
		},
		DARK_CIRCLE: {
			SUBTRACT: 0.05,
			DIVIDE: 0.25,
		},
		TIREDNESS_WEIGHTS: {
			PERCLOS: 0.5,
			DARK: 0.35,
			BLINK: 0.15,
		},
		EYE_AGE_WEIGHTS: {
			PERCLOS: 0.5,
			DARK: 0.3,
			BLINK: 0.2,
		},
	},
	VISUAL: {
		CLAMP_ONE: 1,
		UNDER_EYE: {
			WIDTH_MULTIPLIER: 1.1,
			HEIGHT_MULTIPLIER: 0.45,
			Y_OFFSET: 0.12,
		},
		CHEEK: {
			WIDTH_MULTIPLIER: 0.9,
			HEIGHT_MULTIPLIER: 0.9,
			Y_OFFSET: 0.2,
		},
		FOREHEAD: {
			WIDTH_MULTIPLIER: 0.9,
			HEIGHT_MULTIPLIER: 0.6,
			Y_OFFSET: 0.8,
		},
		LUMINANCE_WEIGHTS: {
			RED: 0.299,
			GREEN: 0.587,
			BLUE: 0.114,
		},
	},
	FALLBACK: {
		BLINK_RATE: 15,
		EYE_AGE: 30,
		FACE_AGE: 30,
	},
	PERCENTAGE: {
		ATTENTION_THRESHOLD: 0.7,
		PERCLOS_THRESHOLDS: {
			VERY_HIGH: 35,
			HIGH: 20,
			MODERATE: 8,
		},
	},
	RANDOM: {
		SQUINT: {
			HIGH: { MIN: 25, RANGE: 15 },
			LOW: { MIN: 5, RANGE: 8 },
		},
		PUPIL: {
			BASE: 3.5,
			PERCLOS_FACTOR: 0.02,
			RANGE: 0.3,
			MIN: 2.0,
		},
		EYE_ASPECT: {
			BASE: 0.25,
			BLINK_FACTOR: 0.01,
			RANGE: 0.05,
		},
	},
	PATHS: {
		MEDIAPIPE: {
			WASM: '/mediapipe/wasm/',
			MODEL: '/mediapipe/models/face_landmarker.task',
		},
		FALLBACK: {
			WASM: '@/utils/wasm',
			MODEL: '@/utils/face_landmarker.task',
		},
	},
	ERROR: {
		CAMERA: 'Failed to access camera',
		INIT: 'Failed to initialize eye tracking model. Please refresh the page.',
		TRACKING: 'Failed to start eye tracking',
	},
};

export const getDecryptedConstants = () => {
	try {
		const data = decrypt<string, ReadonlyEyeTrackingConstants>(ENCRYPTED_EYE_TRACKING);
		// const areSame = JSON.stringify(data) === JSON.stringify(EYE_TRACKING_CONSTANTS_RAW);

		// console.log('Constants are the same:', areSame);
		return data;
	} catch (error) {
		console.error('Failed to decrypt constants, using fallback');
		return EYE_TRACKING_CONSTANTS_RAW;
		// Fallback to importing raw constants
	}
};

// const cy = ciphertext(EYE_TRACKING_CONSTANTS_RAW);

// console.log({ cy });

export const EYE_TRACKING_CONSTANTS = getDecryptedConstants();

export const DEFAULT_COLORS = {
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
} as const;

export const COLOR_SCHEMES = {
	default: DEFAULT_COLORS,
	minimal: {
		...DEFAULT_COLORS,
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

export const MEAN_LUMA_FUNCTION_STRING = `HTKfnwoi^*&^**()`;
