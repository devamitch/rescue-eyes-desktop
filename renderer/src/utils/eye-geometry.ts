import { EYE_TRACKING_CONSTANTS } from '@/constants/eye-tracking';
import { calculateMidpoint, distanceBetweenPoints, Point, Rect } from './eye-tracking';

export type EyeKeypoints = {
	inner: Point;
	outer: Point;
	top: Point;
	bottom: Point;
};

export type UnderEyeRects = {
	under: Rect;
	cheek: Rect;
	forehead: Rect;
};

export const calculateEyeWidth = (eye: EyeKeypoints): number =>
	distanceBetweenPoints(eye.inner, eye.outer);

export const createUnderEyeAndReferenceRects = (eye: EyeKeypoints): UnderEyeRects => {
	const width = calculateEyeWidth(eye);
	const centerX = calculateMidpoint(eye.inner, eye.outer).x;

	// Under eye rectangle
	const underEyeWidth = EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.WIDTH_MULTIPLIER * width;
	const underEyeHeight = EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.HEIGHT_MULTIPLIER * width;
	const underEyeX = centerX - underEyeWidth / 2;
	const underEyeY = eye.bottom.y + EYE_TRACKING_CONSTANTS.VISUAL.UNDER_EYE.Y_OFFSET * width;

	// Cheek reference rectangle
	const cheekWidth = EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.WIDTH_MULTIPLIER * underEyeWidth;
	const cheekHeight = EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.HEIGHT_MULTIPLIER * underEyeHeight;
	const cheekX = centerX - cheekWidth / 2;
	const cheekY =
		underEyeY + underEyeHeight + EYE_TRACKING_CONSTANTS.VISUAL.CHEEK.Y_OFFSET * width;

	// Forehead reference rectangle
	const foreheadWidth = EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.WIDTH_MULTIPLIER * underEyeWidth;
	const foreheadHeight =
		EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.HEIGHT_MULTIPLIER * underEyeHeight;
	const foreheadX = centerX - foreheadWidth / 2;
	const foreheadY =
		eye.top.y - EYE_TRACKING_CONSTANTS.VISUAL.FOREHEAD.Y_OFFSET * width - foreheadHeight;

	return {
		under: { x: underEyeX, y: underEyeY, w: underEyeWidth, h: underEyeHeight },
		cheek: { x: cheekX, y: cheekY, w: cheekWidth, h: cheekHeight },
		forehead: { x: foreheadX, y: foreheadY, w: foreheadWidth, h: foreheadHeight },
	};
};

export const calculateEyeAspectRatio = (
	horizontalDistance: number,
	verticalDistance: number
): number => (verticalDistance > 0 ? horizontalDistance / verticalDistance : 0);

export const calculateAverage = (values: number[]): number =>
	values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export const areEyesClosed = (
	leftAspectRatio: number,
	rightAspectRatio: number,
	threshold: number = EYE_TRACKING_CONSTANTS.BLINK.DETECTION_THRESHOLD
): boolean => {
	const averageRatio = calculateAverage([leftAspectRatio, rightAspectRatio]);
	return averageRatio > threshold;
};
