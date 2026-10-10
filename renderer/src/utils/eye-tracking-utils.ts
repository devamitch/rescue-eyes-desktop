import { EYE_TRACKING_CONSTANTS } from '../constants/eye-tracking-constants';
import { EyeKeypoints, Point, Rectangle, UnderEyeRegions } from '../types/eye-tracking';

const { UNDER_EYE_MULTIPLIERS, CHEEK_MULTIPLIERS, FOREHEAD_MULTIPLIERS, LUMA_COEFFICIENTS } =
	EYE_TRACKING_CONSTANTS;

export class EyeTrackingUtils {
	static clamp01(value: number): number {
		return Math.max(0, Math.min(1, value));
	}

	static calculateDistance(pointA: Point, pointB: Point): number {
		return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
	}

	static safeRect(
		x: number,
		y: number,
		width: number,
		height: number,
		canvasWidth: number,
		canvasHeight: number
	): Rectangle {
		const safeX = Math.max(0, Math.min(canvasWidth - 1, Math.round(x)));
		const safeY = Math.max(0, Math.min(canvasHeight - 1, Math.round(y)));
		const safeWidth = Math.max(1, Math.min(canvasWidth - safeX, Math.round(width)));
		const safeHeight = Math.max(1, Math.min(canvasHeight - safeY, Math.round(height)));

		return { x: safeX, y: safeY, w: safeWidth, h: safeHeight };
	}

	static meanLumaInRect(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number
	): number {
		const { canvas } = ctx;
		const rect = this.safeRect(x, y, width, height, canvas.width, canvas.height);
		const imageData = ctx.getImageData(rect.x, rect.y, rect.w, rect.h);
		const data = imageData.data;

		let sum = 0;
		let count = 0;

		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			sum += LUMA_COEFFICIENTS.R * r + LUMA_COEFFICIENTS.G * g + LUMA_COEFFICIENTS.B * b;
			count++;
		}

		return count ? sum / count : 0;
	}

	static calculateUnderEyeRegions(eye: EyeKeypoints): UnderEyeRegions {
		const eyeWidth = this.calculateDistance(eye.inner, eye.outer);
		const centerX = (eye.inner.x + eye.outer.x) * 0.5;

		// Under-eye region
		const underWidth = UNDER_EYE_MULTIPLIERS.WIDTH * eyeWidth;
		const underHeight = UNDER_EYE_MULTIPLIERS.HEIGHT * eyeWidth;
		const underX = centerX - underWidth / 2;
		const underY = eye.bottom.y + UNDER_EYE_MULTIPLIERS.Y_OFFSET * eyeWidth;

		// Cheek region (reference)
		const cheekWidth = underWidth * CHEEK_MULTIPLIERS.WIDTH;
		const cheekHeight = underHeight * CHEEK_MULTIPLIERS.HEIGHT;
		const cheekX = centerX - cheekWidth / 2;
		const cheekY = underY + underHeight + CHEEK_MULTIPLIERS.Y_OFFSET * eyeWidth;

		// Forehead region (reference)
		const foreheadWidth = underWidth * FOREHEAD_MULTIPLIERS.WIDTH;
		const foreheadHeight = underHeight * FOREHEAD_MULTIPLIERS.HEIGHT;
		const foreheadX = centerX - foreheadWidth / 2;
		const foreheadY = eye.top.y - FOREHEAD_MULTIPLIERS.Y_OFFSET * eyeWidth - foreheadHeight;

		return {
			under: { x: underX, y: underY, w: underWidth, h: underHeight },
			cheek: { x: cheekX, y: cheekY, w: cheekWidth, h: cheekHeight },
			forehead: { x: foreheadX, y: foreheadY, w: foreheadWidth, h: foreheadHeight },
		};
	}

	static calculateBlinkPenalty(blinksPerMinute: number): number {
		return this.clamp01(
			Math.abs(blinksPerMinute - EYE_TRACKING_CONSTANTS.TARGET_BLINKS_PER_MIN) / 12
		);
	}

	static normalizePerclos(perclos: number): number {
		return this.clamp01((perclos - 0.1) / 0.3);
	}

	static calculateEyeAge(blinkRate: number, perclos: number, darkCircleScore: number): number {
		if (blinkRate <= 0 || isNaN(blinkRate)) return EYE_TRACKING_CONSTANTS.MIN_EYE_AGE_YRS;

		const blinkPenalty = this.calculateBlinkPenalty(blinkRate);
		const ageIndex = this.clamp01(
			0.5 * this.normalizePerclos(perclos) + 0.3 * darkCircleScore + 0.2 * blinkPenalty
		);

		const ageRange =
			EYE_TRACKING_CONSTANTS.MAX_EYE_AGE_YRS - EYE_TRACKING_CONSTANTS.MIN_EYE_AGE_YRS;
		return Math.round(EYE_TRACKING_CONSTANTS.MIN_EYE_AGE_YRS + ageIndex * ageRange);
	}

	static calculateFaceAge(
		eyeAge: number,
		attentionFrac: number,
		squintIntensity: number
	): number {
		let faceAge = eyeAge;
		faceAge += (1 - attentionFrac) * 5;
		faceAge += (squintIntensity - 15) / 5;
		return Math.max(18, Math.min(80, Math.round(faceAge)));
	}

	static filterTimestampsByWindow(timestamps: number[], windowMs: number): number[] {
		const cutoff = Date.now() - windowMs;
		return timestamps.filter((timestamp) => timestamp > cutoff);
	}

	static calculatePerclos(closedSamples: Array<{ t: number; closed: boolean }>): number {
		if (closedSamples.length <= 1) return 0;

		let closedMs = 0;
		for (let i = 0; i < closedSamples.length - 1; i++) {
			const timeDiff = closedSamples[i + 1].t - closedSamples[i].t;
			if (closedSamples[i].closed) {
				closedMs += timeDiff;
			}
		}

		const totalMs = closedSamples[closedSamples.length - 1].t - closedSamples[0].t;
		return totalMs > 0 ? closedMs / totalMs : 0;
	}
}
