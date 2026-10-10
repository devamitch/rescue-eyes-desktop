// Sleepiness detection algorithms

export interface SleepinessMetrics {
	eyeClosureDuration: number;
	blinkFrequency: number;
	eyeMovementSpeed: number;
	headPoseStability: number;
	microSleepEvents: number;
	alertnessScore: number;
	isSleepy: boolean;
	sleepinessLevel:
		| 'Alert'
		| 'Slightly Drowsy'
		| 'Moderately Drowsy'
		| 'Very Drowsy'
		| 'Extremely Drowsy';
}

export class SleepinessDetector {
	private eyeClosureHistory: number[] = [];
	private blinkTimestamps: number[] = [];
	private headPoseHistory: Array<{ x: number; y: number; z: number }> = [];
	private microSleepCount = 0;
	private lastAnalysisTime = 0;

	private static readonly THRESHOLDS = {
		EYE_CLOSURE_DROWSY: 0.25, // EAR threshold for closed eyes
		LONG_BLINK_DURATION: 500, // ms
		MICROSLEEP_DURATION: 1000, // ms
		BLINK_RATE_LOW: 8, // blinks per minute
		BLINK_RATE_HIGH: 25, // blinks per minute
		HEAD_MOVEMENT_THRESHOLD: 0.1,
	};

	analyzeSleepiness(
		eyeAspectRatio: number,
		landmarks: any[],
		timestamp: number
	): SleepinessMetrics {
		const currentTime = Date.now();

		// Update eye closure history
		this.updateEyeClosureHistory(eyeAspectRatio, currentTime);

		// Update blink detection
		this.updateBlinkDetection(eyeAspectRatio, currentTime);

		// Update head pose tracking
		this.updateHeadPoseTracking(landmarks, currentTime);

		// Calculate metrics
		const eyeClosureDuration = this.calculateAverageEyeClosureDuration();
		const blinkFrequency = this.calculateBlinkFrequency();
		const eyeMovementSpeed = this.calculateEyeMovementSpeed();
		const headPoseStability = this.calculateHeadPoseStability();
		const microSleepEvents = this.detectMicroSleepEvents();

		// Calculate overall alertness score
		const alertnessScore = this.calculateAlertnessScore(
			eyeClosureDuration,
			blinkFrequency,
			eyeMovementSpeed,
			headPoseStability,
			microSleepEvents
		);

		const isSleepy = alertnessScore < 0.6;
		const sleepinessLevel = this.determineSleepinessLevel(alertnessScore);

		return {
			eyeClosureDuration,
			blinkFrequency,
			eyeMovementSpeed,
			headPoseStability,
			microSleepEvents,
			alertnessScore,
			isSleepy,
			sleepinessLevel,
		};
	}

	private updateEyeClosureHistory(eyeAspectRatio: number, timestamp: number) {
		// Keep last 30 seconds of data
		const thirtySecondsAgo = timestamp - 30000;
		this.eyeClosureHistory = this.eyeClosureHistory
			.filter((entry) => entry > thirtySecondsAgo)
			.concat([eyeAspectRatio]);

		// Limit to reasonable size
		if (this.eyeClosureHistory.length > 900) {
			// 30fps * 30s
			this.eyeClosureHistory = this.eyeClosureHistory.slice(-900);
		}
	}

	private updateBlinkDetection(eyeAspectRatio: number, timestamp: number) {
		const isEyeClosed = eyeAspectRatio < SleepinessDetector.THRESHOLDS.EYE_CLOSURE_DROWSY;

		// Detect blink events (eye closure followed by opening)
		if (this.eyeClosureHistory.length >= 2) {
			const prevEAR = this.eyeClosureHistory[this.eyeClosureHistory.length - 2];
			const currEAR = eyeAspectRatio;

			// Blink detected: was open, now closed, then open again
			if (
				prevEAR >= SleepinessDetector.THRESHOLDS.EYE_CLOSURE_DROWSY &&
				currEAR < SleepinessDetector.THRESHOLDS.EYE_CLOSURE_DROWSY
			) {
				this.blinkTimestamps.push(timestamp);

				// Keep only last 2 minutes of blinks
				const twoMinutesAgo = timestamp - 120000;
				this.blinkTimestamps = this.blinkTimestamps.filter((t) => t > twoMinutesAgo);
			}
		}
	}

	private updateHeadPoseTracking(landmarks: any[], timestamp: number) {
		if (!landmarks || landmarks.length === 0) return;

		// Estimate head pose from key landmarks
		const noseTip = landmarks[1];
		const leftEye = landmarks[33];
		const rightEye = landmarks[263];

		if (noseTip && leftEye && rightEye) {
			const headPose = {
				x: noseTip.x,
				y: noseTip.y,
				z: noseTip.z || 0,
			};

			this.headPoseHistory.push(headPose);

			// Keep only last 10 seconds
			if (this.headPoseHistory.length > 300) {
				// 30fps * 10s
				this.headPoseHistory = this.headPoseHistory.slice(-300);
			}
		}
	}

	private calculateAverageEyeClosureDuration(): number {
		if (this.eyeClosureHistory.length === 0) return 0;

		let totalClosedTime = 0;
		let closedPeriods = 0;
		let currentClosedDuration = 0;

		for (const ear of this.eyeClosureHistory) {
			if (ear < SleepinessDetector.THRESHOLDS.EYE_CLOSURE_DROWSY) {
				currentClosedDuration++;
			} else {
				if (currentClosedDuration > 0) {
					totalClosedTime += currentClosedDuration;
					closedPeriods++;
					currentClosedDuration = 0;
				}
			}
		}

		// Add current period if still closed
		if (currentClosedDuration > 0) {
			totalClosedTime += currentClosedDuration;
			closedPeriods++;
		}

		return closedPeriods > 0 ? totalClosedTime / closedPeriods : 0;
	}

	private calculateBlinkFrequency(): number {
		const now = Date.now();
		const oneMinuteAgo = now - 60000;

		const recentBlinks = this.blinkTimestamps.filter((t) => t > oneMinuteAgo);
		return recentBlinks.length; // blinks per minute
	}

	private calculateEyeMovementSpeed(): number {
		// Simplified eye movement calculation
		// In a real implementation, this would track pupil/iris movement
		return Math.random() * 0.5 + 0.5; // Placeholder
	}

	private calculateHeadPoseStability(): number {
		if (this.headPoseHistory.length < 10) return 1;

		let totalMovement = 0;
		for (let i = 1; i < this.headPoseHistory.length; i++) {
			const prev = this.headPoseHistory[i - 1];
			const curr = this.headPoseHistory[i];

			const movement = Math.sqrt(
				Math.pow(curr.x - prev.x, 2) +
					Math.pow(curr.y - prev.y, 2) +
					Math.pow(curr.z - prev.z, 2)
			);

			totalMovement += movement;
		}

		const averageMovement = totalMovement / (this.headPoseHistory.length - 1);

		// Convert to stability score (less movement = more stable = potentially drowsy)
		return Math.max(0, 1 - averageMovement * 10);
	}

	private detectMicroSleepEvents(): number {
		// Detect periods of extended eye closure (microsleep)
		let microSleepCount = 0;
		let consecutiveClosedFrames = 0;

		for (const ear of this.eyeClosureHistory) {
			if (ear < SleepinessDetector.THRESHOLDS.EYE_CLOSURE_DROWSY) {
				consecutiveClosedFrames++;
			} else {
				if (consecutiveClosedFrames > 30) {
					// ~1 second at 30fps
					microSleepCount++;
				}
				consecutiveClosedFrames = 0;
			}
		}

		// Check final period
		if (consecutiveClosedFrames > 30) {
			microSleepCount++;
		}

		return microSleepCount;
	}

	private calculateAlertnessScore(
		eyeClosureDuration: number,
		blinkFrequency: number,
		eyeMovementSpeed: number,
		headPoseStability: number,
		microSleepEvents: number
	): number {
		let score = 1.0;

		// Penalize long eye closures
		if (eyeClosureDuration > 10) {
			score -= 0.3;
		} else if (eyeClosureDuration > 5) {
			score -= 0.15;
		}

		// Penalize abnormal blink rates
		if (blinkFrequency < SleepinessDetector.THRESHOLDS.BLINK_RATE_LOW) {
			score -= 0.2; // Too few blinks
		} else if (blinkFrequency > SleepinessDetector.THRESHOLDS.BLINK_RATE_HIGH) {
			score -= 0.1; // Too many blinks (fighting sleep)
		}

		// Penalize low eye movement
		if (eyeMovementSpeed < 0.3) {
			score -= 0.2;
		}

		// Penalize excessive head stability (nodding off)
		if (headPoseStability > 0.9) {
			score -= 0.25;
		}

		// Heavily penalize microsleep events
		score -= microSleepEvents * 0.4;

		return Math.max(0, Math.min(1, score));
	}

	private determineSleepinessLevel(alertnessScore: number): SleepinessMetrics['sleepinessLevel'] {
		if (alertnessScore >= 0.8) return 'Alert';
		if (alertnessScore >= 0.6) return 'Slightly Drowsy';
		if (alertnessScore >= 0.4) return 'Moderately Drowsy';
		if (alertnessScore >= 0.2) return 'Very Drowsy';
		return 'Extremely Drowsy';
	}

	reset() {
		this.eyeClosureHistory = [];
		this.blinkTimestamps = [];
		this.headPoseHistory = [];
		this.microSleepCount = 0;
		this.lastAnalysisTime = 0;
	}
}
