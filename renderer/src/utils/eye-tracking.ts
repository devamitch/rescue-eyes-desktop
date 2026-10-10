import { EYE_TRACKING_CONSTANTS } from '@/constants/eye-tracking';

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

// Math utilities
export const clamp = (value: number, min: number, max: number): number =>
	Math.max(min, Math.min(max, value));

export const clamp01 = (value: number): number =>
	clamp(value, 0, EYE_TRACKING_CONSTANTS.VISUAL.CLAMP_ONE);

export const distanceBetweenPoints = (a: Point, b: Point): number =>
	Math.hypot(a.x - b.x, a.y - b.y);

export const calculateMidpoint = (a: Point, b: Point): Point => ({
	x: (a.x + b.x) * 0.5,
	y: (a.y + b.y) * 0.5,
});

// Geometry utilities
export const createSafeRect = (
	x: number,
	y: number,
	width: number,
	height: number,
	maxWidth: number,
	maxHeight: number
): Rect => {
	const safeX = Math.max(0, Math.min(maxWidth - 1, Math.round(x)));
	const safeY = Math.max(0, Math.min(maxHeight - 1, Math.round(y)));
	const safeWidth = Math.max(1, Math.min(maxWidth - safeX, Math.round(width)));
	const safeHeight = Math.max(1, Math.min(maxHeight - safeY, Math.round(height)));

	return { x: safeX, y: safeY, w: safeWidth, h: safeHeight };
};

export const calculateRectArea = (rect: Rect): number => rect.w * rect.h;

// Image processing utilities
export const calculateLuminance = (r: number, g: number, b: number): number =>
	EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.RED * r +
	EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.GREEN * g +
	EYE_TRACKING_CONSTANTS.VISUAL.LUMINANCE_WEIGHTS.BLUE * b;

export const calculateMeanLuminanceInRect = (
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number
): number => {
	const { canvas } = ctx;
	const rect = createSafeRect(x, y, width, height, canvas.width, canvas.height);
	const imageData = ctx.getImageData(rect.x, rect.y, rect.w, rect.h);
	const data = imageData.data;

	let sum = 0;
	let count = 0;

	for (let i = 0; i < data.length; i += 4) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];

		sum += calculateLuminance(r, g, b);
		count++;
	}

	return count > 0 ? sum / count : 0;
};

// Eye tracking specific utilities
export const calculateBlinkPenalty = (blinksPerMinute: number): number => {
	const deviation = Math.abs(blinksPerMinute - EYE_TRACKING_CONSTANTS.BLINK.TARGET_PER_MIN);
	return clamp01(deviation / EYE_TRACKING_CONSTANTS.BLINK.PENALTY_DIVISOR);
};

export const normalizePerclos = (perclosValue: number): number => {
	const normalized =
		(perclosValue - EYE_TRACKING_CONSTANTS.METRICS.PERCLOS_NORMALIZATION.SUBTRACT) /
		EYE_TRACKING_CONSTANTS.METRICS.PERCLOS_NORMALIZATION.DIVIDE;
	return clamp01(normalized);
};

export const normalizeDarkCircleScore = (score: number): number => {
	const normalized =
		(score - EYE_TRACKING_CONSTANTS.METRICS.DARK_CIRCLE.SUBTRACT) /
		EYE_TRACKING_CONSTANTS.METRICS.DARK_CIRCLE.DIVIDE;
	return clamp01(normalized);
};

// Time utilities
export const getCurrentTimestamp = (): string => new Date().toLocaleTimeString();

export const filterByTimeWindow = <T extends { t: number }>(
	items: T[],
	windowMs: number,
	currentTime: number = Date.now()
): T[] => items.filter((item) => item.t > currentTime - windowMs);

// Array utilities
export const maintainArraySize = <T>(array: T[], maxSize: number, newItems: T[] = []): T[] => {
	const combined = [...array, ...newItems];
	return combined.slice(-maxSize);
};

// Validation utilities
export const isValidNumber = (value: number): boolean =>
	!isNaN(value) && isFinite(value) && value > 0;

export const isValidAge = (age: number): boolean =>
	isValidNumber(age) && age <= EYE_TRACKING_CONSTANTS.AGE.ABSOLUTE_MAX;
