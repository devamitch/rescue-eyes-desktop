import { SecureEyeTrackingModel } from '../models/secure-eye-tracking-model';
import { EyeMetrics, EyeTrackingConfig, StreamAnalysisResult } from '../types/eye-tracking';

/**
 * Eye Tracking Service
 * This service acts as a bridge between your UI and the secure model
 * It handles stream processing and can be deployed separately for security
 */
export class EyeTrackingService {
	private model: SecureEyeTrackingModel;
	private isProcessing = false;
	private metricsCallback?: (metrics: EyeMetrics) => void;
	private errorCallback?: (error: string) => void;

	constructor(config: EyeTrackingConfig = {}) {
		this.model = new SecureEyeTrackingModel(config);
	}

	/**
	 * Initialize the eye tracking model
	 */
	async initialize(): Promise<boolean> {
		try {
			const success = await this.model.initialize();
			if (!success) {
				this.handleError('Failed to initialize eye tracking model');
			}
			return success;
		} catch (error) {
			this.handleError(
				`Initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
			return false;
		}
	}

	/**
	 * Start processing video stream
	 */
	async startProcessing(
		videoElement: HTMLVideoElement,
		onMetrics: (metrics: EyeMetrics) => void,
		onError?: (error: string) => void
	): Promise<boolean> {
		if (!this.model.isInitialized()) {
			this.handleError('Model not initialized');
			return false;
		}

		if (this.isProcessing) {
			this.handleError('Already processing');
			return false;
		}

		this.metricsCallback = onMetrics;
		this.errorCallback = onError;
		this.isProcessing = true;

		try {
			await this.processVideoFrame(videoElement);
			return true;
		} catch (error) {
			this.handleError(
				`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
			this.stopProcessing();
			return false;
		}
	}

	/**
	 * Stop processing video stream
	 */
	stopProcessing(): void {
		this.isProcessing = false;
		this.metricsCallback = undefined;
		this.errorCallback = undefined;
	}

	/**
	 * Reset metrics (useful for new sessions)
	 */
	resetMetrics(): void {
		this.model.resetMetrics();
	}

	/**
	 * Get single frame analysis
	 */
	async analyzeFrame(videoElement: HTMLVideoElement): Promise<StreamAnalysisResult | null> {
		if (!this.model.isInitialized()) {
			throw new Error('Model not initialized');
		}
		return await this.model.analyzeStream(videoElement);
	}

	/**
	 * Check if service is initialized
	 */
	isInitialized(): boolean {
		return this.model.isInitialized();
	}

	/**
	 * Dispose of the service and free resources
	 */
	dispose(): void {
		this.stopProcessing();
		this.model.dispose();
	}

	private async processVideoFrame(videoElement: HTMLVideoElement): Promise<void> {
		if (!this.isProcessing) return;

		try {
			const result = await this.model.analyzeStream(videoElement);

			if (result && this.metricsCallback) {
				this.metricsCallback(result.metrics);
			}

			// Schedule next frame
			if (this.isProcessing) {
				requestAnimationFrame(() => this.processVideoFrame(videoElement));
			}
		} catch (error) {
			this.handleError(
				`Frame processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private handleError(message: string): void {
		console.error('[EyeTrackingService]', message);
		if (this.errorCallback) {
			this.errorCallback(message);
		}
	}
}
