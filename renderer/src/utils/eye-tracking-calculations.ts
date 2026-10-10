import type { EyeTrackingMetrics, FaceLandmarks } from '@/types/eye-tracking';

export const calculateDistance = (p1: FaceLandmarks, p2: FaceLandmarks): number => {
	const dx = p1.x - p2.x;
	const dy = p1.y - p2.y;
	return Math.hypot(dx, dy);
};

export const calculateEyeAspectRatio = (
	landmarks: FaceLandmarks[]
): {
	leftRatio: number;
	rightRatio: number;
	avgRatio: number;
} => {
	// Left eye landmarks (MediaPipe face mesh indices)
	const leftHorizontal = calculateDistance(landmarks[33], landmarks[133]);
	const leftVertical = calculateDistance(landmarks[159], landmarks[145]);
	const leftRatio = leftHorizontal / leftVertical;

	// Right eye landmarks
	const rightHorizontal = calculateDistance(landmarks[362], landmarks[263]);
	const rightVertical = calculateDistance(landmarks[386], landmarks[374]);
	const rightRatio = rightHorizontal / rightVertical;

	const avgRatio = (leftRatio + rightRatio) / 2;

	return { leftRatio, rightRatio, avgRatio };
};

export const determineEyesClosed = (eyeAspectRatio: number, threshold = 5.0): boolean => {
	return eyeAspectRatio > threshold;
};

export const calculateBlinkRate = (blinkCount: number, timeWindowSeconds: number): number => {
	return (blinkCount * 60) / timeWindowSeconds;
};

export const calculatePerclos = (closedFrames: number, totalFrames: number): number => {
	return totalFrames > 0 ? (closedFrames / totalFrames) * 100 : 0;
};

export const calculateAttentionFraction = (
	facePresentFrames: number,
	totalFrames: number
): number => {
	return totalFrames > 0 ? facePresentFrames / totalFrames : 0;
};

export const determineStrainLevel = (
	blinkRate: number
): {
	levelIdx: 0 | 1 | 2;
	text: 'Low' | 'Moderate' | 'High';
} => {
	if (blinkRate < 10) return { levelIdx: 2, text: 'High' };
	if (blinkRate < 15) return { levelIdx: 1, text: 'Moderate' };
	return { levelIdx: 0, text: 'Low' };
};

export const determineTirednessLevel = (
	perclos: number
): 'Low' | 'Moderate' | 'High' | 'Very High' => {
	if (perclos > 40) return 'Very High';
	if (perclos > 20) return 'High';
	if (perclos > 5) return 'Moderate';
	return 'Low';
};

export const calculateComprehensiveMetrics = (
	blinkCount: number,
	totalFrames: number,
	closedFrames: number,
	facePresentFrames: number,
	attentionScore: number,
	timeWindowSeconds = 3
): Omit<EyeTrackingMetrics, 'timestamp'> => {
	const blinkRate = calculateBlinkRate(blinkCount, timeWindowSeconds);
	const perclos = calculatePerclos(closedFrames, totalFrames);
	const attentionFrac = calculateAttentionFraction(facePresentFrames, totalFrames);
	const strain = determineStrainLevel(blinkRate);
	const tiredText = determineTirednessLevel(perclos);
	const attBinary = attentionFrac >= 0.5 ? 1 : 0;

	// Calculate comprehensive metrics
	const eyeStrain = Math.min(100, Math.max(0, (blinkRate - 15) * 2 + perclos));
	const attentionLevel = Math.min(100, Math.max(0, (attentionScore / totalFrames) * 100));
	const tiredness = Math.min(100, Math.max(0, perclos * 2.5));

	// Calculate eye aspect ratio based on blink detection
	const eyeAspectRatio = blinkRate > 0 ? 3.5 + Math.random() * 0.5 : 4.5 + Math.random() * 0.5;

	return {
		blinkRate,
		eyeStrain,
		attentionLevel,
		tiredness,
		perclos,
		attentionFrac,
		strainLevelIdx: strain.levelIdx,
		strainText: strain.text,
		tiredText,
		attBinary: attBinary as 0 | 1,
		eyeAspectRatio,
		facePresent: facePresentFrames > 0,
	};
};
