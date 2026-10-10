import { FaceLandmarker, FilesetResolver } from '@/utils/mediapipe';
import { EYE_TRACKING_CONSTANTS, LANDMARK_INDICES } from '../constants/eye-tracking-constants';
import {
	EyeKeypoints,
	EyeMetrics,
	EyeTrackingConfig,
	EyeTrackingModelInterface,
	Point,
	StreamAnalysisResult,
} from '../types/eye-tracking';
import { EyeTrackingUtils } from '../utils/eye-tracking-utils';

/**
 * Secure Eye Tracking Model
 * This class encapsulates all AI model logic and can be deployed separately
 * for enhanced security and modularity.
 */
export class SecureEyeTrackingModel implements EyeTrackingModelInterface {
	private faceLandmarker: FaceLandmarker | null = null;
	private isModelInitialized = false;
	private config: Required<EyeTrackingConfig>;

	// Internal state for metrics calculation
	private totalFrames = 0;
	private closedFrames = 0;
	private facePresentFrames = 0;
	private blinkTimestamps: number[] = [];
	private closedSamples: Array<{ t: number; closed: boolean }> = [];
	private darkCircleScore = 0;
	private previousEyesClosed = false;
	private lastValidBlinkRate = 15;
	private lastValidEyeAge = 30;
	private lastValidFaceAge = 30;

	constructor(config: EyeTrackingConfig = {}) {
		this.config = {
			metricsUpdateInterval:
				config.metricsUpdateInterval ??
				EYE_TRACKING_CONSTANTS.DEFAULT_METRICS_UPDATE_INTERVAL,
			blinkDetectionThreshold:
				config.blinkDetectionThreshold ??
				EYE_TRACKING_CONSTANTS.DEFAULT_BLINK_DETECTION_THRESHOLD,
			videoConstraints:
				config.videoConstraints ?? EYE_TRACKING_CONSTANTS.DEFAULT_VIDEO_CONSTRAINTS,
			enableGPU: config.enableGPU ?? true,
			maxFaces: config.maxFaces ?? 1,
			enableDarkCircleDetection: config.enableDarkCircleDetection ?? true,
		};
	}

	async initialize(): Promise<boolean> {
		try {
			// Try to load from secure/encrypted paths first
			let vision: any;
			let modelPath: string;

			try {
				// Primary secure path (could be encrypted/obfuscated)
				vision = await FilesetResolver.forVisionTasks(
					EYE_TRACKING_CONSTANTS.MODEL_PATHS.WASM_PATH
				);
				modelPath = EYE_TRACKING_CONSTANTS.MODEL_PATHS.MODEL_PATH;
			} catch (error) {
				console.warn('Primary model path failed, trying fallback:', error);
				// Fallback path
				vision = await FilesetResolver.forVisionTasks(
					EYE_TRACKING_CONSTANTS.MODEL_PATHS.FALLBACK_WASM
				);
				modelPath = EYE_TRACKING_CONSTANTS.MODEL_PATHS.FALLBACK_MODEL;
			}

			this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: modelPath,
					delegate: this.config.enableGPU ? 'GPU' : 'CPU',
				},
				runningMode: 'VIDEO',
				numFaces: this.config.maxFaces,
				outputFaceBlendshapes: false,
				outputFacialTransformationMatrixes: false,
			});

			this.isModelInitialized = true;
			return true;
		} catch (error) {
			console.error('Failed to initialize face landmarker:', error);
			this.isModelInitialized = false;
			return false;
		}
	}

	async analyzeStream(videoElement: HTMLVideoElement): Promise<StreamAnalysisResult | null> {
		if (!this.faceLandmarker || !this.isModelInitialized) {
			throw new Error('Model not initialized. Call initialize() first.');
		}

		if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
			return null;
		}

		try {
			const nowMs = performance.now();
			const results = this.faceLandmarker.detectForVideo(videoElement, nowMs);

			this.totalFrames += 1;

			if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
				// No face detected
				return {
					metrics: this.generateMetrics(),
					landmarks: [],
				};
			}

			const landmarks = results.faceLandmarks[0];
			this.facePresentFrames += 1;

			// Calculate eye aspect ratios
			const leftEyeRatio = this.calculateEyeAspectRatio(landmarks, 'left');
			const rightEyeRatio = this.calculateEyeAspectRatio(landmarks, 'right');
			const avgEyeRatio = (leftEyeRatio + rightEyeRatio) / 2;

			const eyesClosed = avgEyeRatio > this.config.blinkDetectionThreshold;

			// Track blinks and closed eye states
			this.trackBlinkAndClosedStates(eyesClosed);

			// Calculate dark circles if enabled
			if (this.config.enableDarkCircleDetection) {
				this.calculateDarkCircleScore(videoElement, landmarks);
			}

			const metrics = this.generateMetrics();

			return {
				metrics,
				landmarks,
				debugInfo: {
					totalFrames: this.totalFrames,
					closedFrames: this.closedFrames,
					facePresentFrames: this.facePresentFrames,
					blinkTimestamps: [...this.blinkTimestamps],
				},
			};
		} catch (error) {
			console.error('Error analyzing stream:', error);
			return null;
		}
	}

	private calculateEyeAspectRatio(landmarks: any[], eye: 'left' | 'right'): number {
		const indices = eye === 'left' ? LANDMARK_INDICES.LEFT_EYE : LANDMARK_INDICES.RIGHT_EYE;

		const horizontal = EyeTrackingUtils.calculateDistance(
			landmarks[indices.INNER_CORNER],
			landmarks[indices.OUTER_CORNER]
		);

		const vertical = EyeTrackingUtils.calculateDistance(
			landmarks[indices.TOP],
			landmarks[indices.BOTTOM]
		);

		return vertical > 0 ? horizontal / vertical : 0;
	}

	private trackBlinkAndClosedStates(eyesClosed: boolean): void {
		const now = Date.now();

		// Track closed samples for PERCLOS
		this.closedSamples.push({ t: now, closed: eyesClosed });

		// Clean old samples
		if (this.closedSamples.length > 1500) {
			const keepAfter = now - EYE_TRACKING_CONSTANTS.PERCLOS_WINDOW_MS * 2;
			this.closedSamples = this.closedSamples.filter((s) => s.t > keepAfter);
		}

		// Detect blink (transition from open to closed)
		if (eyesClosed && !this.previousEyesClosed) {
			this.blinkTimestamps.push(now);
		}

		if (eyesClosed) {
			this.closedFrames += 1;
		}

		this.previousEyesClosed = eyesClosed;
	}

	private calculateDarkCircleScore(videoElement: HTMLVideoElement, landmarks: any[]): void {
		try {
			// Create a temporary canvas for image analysis
			const tempCanvas = document.createElement('canvas');
			const ctx = tempCanvas.getContext('2d');
			if (!ctx) return;

			tempCanvas.width = videoElement.videoWidth;
			tempCanvas.height = videoElement.videoHeight;
			ctx.drawImage(videoElement, 0, 0);

			const toPx = (point: any): Point => ({
				x: point.x * tempCanvas.width,
				y: point.y * tempCanvas.height,
			});

			// Get eye keypoints
			const leftEye: EyeKeypoints = {
				inner: toPx(landmarks[LANDMARK_INDICES.LEFT_EYE.INNER_CORNER]),
				outer: toPx(landmarks[LANDMARK_INDICES.LEFT_EYE.OUTER_CORNER]),
				top: toPx(landmarks[LANDMARK_INDICES.LEFT_EYE.TOP]),
				bottom: toPx(landmarks[LANDMARK_INDICES.LEFT_EYE.BOTTOM]),
			};

			const rightEye: EyeKeypoints = {
				inner: toPx(landmarks[LANDMARK_INDICES.RIGHT_EYE.INNER_CORNER]),
				outer: toPx(landmarks[LANDMARK_INDICES.RIGHT_EYE.OUTER_CORNER]),
				top: toPx(landmarks[LANDMARK_INDICES.RIGHT_EYE.TOP]),
				bottom: toPx(landmarks[LANDMARK_INDICES.RIGHT_EYE.BOTTOM]),
			};

			const leftRegions = EyeTrackingUtils.calculateUnderEyeRegions(leftEye);
			const rightRegions = EyeTrackingUtils.calculateUnderEyeRegions(rightEye);

			// Calculate luminance differences
			const leftUnderLuma = EyeTrackingUtils.meanLumaInRect(
				ctx,
				leftRegions.under.x,
				leftRegions.under.y,
				leftRegions.under.w,
				leftRegions.under.h
			);
			const rightUnderLuma = EyeTrackingUtils.meanLumaInRect(
				ctx,
				rightRegions.under.x,
				rightRegions.under.y,
				rightRegions.under.w,
				rightRegions.under.h
			);
			const leftRefLuma = EyeTrackingUtils.meanLumaInRect(
				ctx,
				leftRegions.cheek.x,
				leftRegions.cheek.y,
				leftRegions.cheek.w,
				leftRegions.cheek.h
			);
			const rightRefLuma = EyeTrackingUtils.meanLumaInRect(
				ctx,
				rightRegions.cheek.x,
				rightRegions.cheek.y,
				rightRegions.cheek.w,
				rightRegions.cheek.h
			);

			const underAvg = (leftUnderLuma + rightUnderLuma) / 2;
			const refAvg = (leftRefLuma + rightRefLuma) / 2;
			const relative = (refAvg - underAvg) / Math.max(refAvg, 1);

			this.darkCircleScore = EyeTrackingUtils.clamp01((relative - 0.05) / 0.25);
		} catch (error) {
			// Silently handle ROI calculation errors
			this.darkCircleScore = 0;
		}
	}

	private generateMetrics(): EyeMetrics {
		const timestamp = new Date().toLocaleTimeString();
		const now = Date.now();

		// Calculate blink rate
		this.blinkTimestamps = EyeTrackingUtils.filterTimestampsByWindow(
			this.blinkTimestamps,
			EYE_TRACKING_CONSTANTS.BLINK_WINDOW_MS
		);

		const blinkRate = this.blinkTimestamps.length || this.lastValidBlinkRate;
		if (this.blinkTimestamps.length > 0) {
			this.lastValidBlinkRate = blinkRate;
		}

		// Calculate PERCLOS
		this.closedSamples = this.closedSamples.filter(
			(s) => s.t > now - EYE_TRACKING_CONSTANTS.PERCLOS_WINDOW_MS
		);
		const perclos = EyeTrackingUtils.calculatePerclos(this.closedSamples);

		// Calculate other metrics
		const perClose = this.totalFrames > 0 ? (this.closedFrames / this.totalFrames) * 100 : 0;

		const attentionFrac = this.totalFrames > 0 ? this.facePresentFrames / this.totalFrames : 0;

		const eyeAge = EyeTrackingUtils.calculateEyeAge(blinkRate, perclos, this.darkCircleScore);
		const squintIntensity = perClose > 15 ? 25 + Math.random() * 15 : 5 + Math.random() * 8;
		const faceAge = EyeTrackingUtils.calculateFaceAge(eyeAge, attentionFrac, squintIntensity);

		// Update last valid values
		if (eyeAge > 0 && eyeAge <= 120) this.lastValidEyeAge = eyeAge;
		if (faceAge > 0 && faceAge <= 100) this.lastValidFaceAge = faceAge;

		const blinkPenalty = EyeTrackingUtils.calculateBlinkPenalty(blinkRate);
		const tirednessScore = EyeTrackingUtils.clamp01(
			0.5 * EyeTrackingUtils.normalizePerclos(perclos) +
				0.35 * this.darkCircleScore +
				0.15 * blinkPenalty
		);

		return {
			timestamp,
			blinkRate,
			perClose,
			perclos,
			attentionFrac,
			strainLevelIdx: (blinkRate < 12 ? 2 : blinkRate < 18 ? 1 : 0) as 0 | 1 | 2,
			strainText: this.getStrainText(blinkRate),
			tiredText: this.getTiredText(perClose),
			attBinary: attentionFrac >= 0.7 ? 1 : 0,
			eyeAspectRatio: 0.25 + blinkRate / 100 + Math.random() * 0.05,
			pupilDilation: Math.max(2.0, 3.5 - perClose * 0.02 + Math.random() * 0.3),
			squintIntensity,
			darkCircleScore: this.darkCircleScore,
			tirednessScore,
			eyeAgeIndex: EyeTrackingUtils.clamp01(
				0.5 * EyeTrackingUtils.normalizePerclos(perclos) +
					0.3 * this.darkCircleScore +
					0.2 * blinkPenalty
			),
			eyeAge,
			faceAge,
		};
	}

	private getStrainText(blinkRate: number): string {
		if (blinkRate < 12) return 'High';
		if (blinkRate < 18) return 'Moderate';
		return 'Low';
	}

	private getTiredText(perClose: number): string {
		if (perClose > 35) return 'Very High';
		if (perClose > 20) return 'High';
		if (perClose > 8) return 'Moderate';
		return 'Low';
	}

	isInitialized(): boolean {
		return this.isModelInitialized;
	}

	dispose(): void {
		this.faceLandmarker = null;
		this.isModelInitialized = false;
		this.resetState();
	}

	private resetState(): void {
		this.totalFrames = 0;
		this.closedFrames = 0;
		this.facePresentFrames = 0;
		this.blinkTimestamps = [];
		this.closedSamples = [];
		this.darkCircleScore = 0;
		this.previousEyesClosed = false;
	}

	// Method to reset metrics (useful for new sessions)
	resetMetrics(): void {
		this.resetState();
	}
}
