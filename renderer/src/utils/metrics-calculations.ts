import { EYE_TRACKING_CONSTANTS } from '@/constants/eye-tracking';
import { calculateBlinkPenalty, clamp01, normalizePerclos } from './eye-tracking';

export const calculatePerclos = (closedSamples: Array<{ t: number; closed: boolean }>): number => {
	if (closedSamples.length <= 1) return 0;

	let closedTime = 0;
	let totalTime = 0;

	for (let i = 0; i < closedSamples.length - 1; i++) {
		const timeDiff = closedSamples[i + 1].t - closedSamples[i].t;
		totalTime += timeDiff;

		if (closedSamples[i].closed) {
			closedTime += timeDiff;
		}
	}

	return totalTime > 0 ? closedTime / totalTime : 0;
};

export const calculateTirednessScore = (
	perclos: number,
	darkCircleScore: number,
	blinkRate: number
): number => {
	const normalizedPerclos = normalizePerclos(perclos);
	const blinkPenalty = calculateBlinkPenalty(blinkRate);

	return clamp01(
		EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.PERCLOS * normalizedPerclos +
			EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.DARK * darkCircleScore +
			EYE_TRACKING_CONSTANTS.METRICS.TIREDNESS_WEIGHTS.BLINK * blinkPenalty
	);
};

export const calculateEyeAgeIndex = (
	perclos: number,
	darkCircleScore: number,
	blinkRate: number
): number => {
	const normalizedPerclos = normalizePerclos(perclos);
	const blinkPenalty = calculateBlinkPenalty(blinkRate);

	return clamp01(
		EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.PERCLOS * normalizedPerclos +
			EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.DARK * darkCircleScore +
			EYE_TRACKING_CONSTANTS.METRICS.EYE_AGE_WEIGHTS.BLINK * blinkPenalty
	);
};

export const calculateEyeAge = (
	eyeAgeIndex: number,
	minAge: number = EYE_TRACKING_CONSTANTS.AGE.MIN_EYE,
	maxAge: number = EYE_TRACKING_CONSTANTS.AGE.MAX_EYE
): number => Math.round(minAge + eyeAgeIndex * (maxAge - minAge));

export const calculateFaceAge = (
	eyeAge: number,
	attentionFraction: number,
	squintIntensity: number
): number => {
	let faceAge = eyeAge;
	faceAge += (1 - attentionFraction) * EYE_TRACKING_CONSTANTS.AGE.FACE_ATTENTION_IMPACT;
	faceAge += (squintIntensity - 15) / 5;

	return Math.max(
		EYE_TRACKING_CONSTANTS.AGE.MIN_FACE,
		Math.min(EYE_TRACKING_CONSTANTS.AGE.MAX_FACE, Math.round(faceAge))
	);
};

export const generateRandomSquintIntensity = (perClose: number): number => {
	if (perClose > 15) {
		return (
			EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.HIGH.MIN +
			Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.HIGH.RANGE
		);
	}

	return (
		EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.LOW.MIN +
		Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.SQUINT.LOW.RANGE
	);
};

export const generateRandomPupilDilation = (perClose: number): number => {
	const base = EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.BASE;
	const perclosFactor = EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.PERCLOS_FACTOR;
	const randomVariation = Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.RANGE;
	const minPupilSize = EYE_TRACKING_CONSTANTS.RANDOM.PUPIL.MIN;

	return Math.max(minPupilSize, base - perClose * perclosFactor + randomVariation);
};

export const generateRandomEyeAspectRatio = (blinkRate: number): number => {
	const base = EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.BASE;
	const blinkFactor = EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.BLINK_FACTOR;
	const randomVariation = Math.random() * EYE_TRACKING_CONSTANTS.RANDOM.EYE_ASPECT.RANGE;

	return base + blinkRate * blinkFactor + randomVariation;
};
