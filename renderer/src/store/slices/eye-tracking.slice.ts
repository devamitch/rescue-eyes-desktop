import type { StateCreator } from 'zustand';
import { AppStoreState } from '..';

// Eye tracking metrics interface
export interface EyeTrackingMetrics {
	timestamp: string;
	blinkRate: number;
	perClose: number;
	attentionFrac: number;
	strainLevelIdx: 0 | 1 | 2;
	strainText: 'Low' | 'Moderate' | 'High';
	tiredText: 'Low' | 'Moderate' | 'High' | 'Very High';
	attBinary: 0 | 1;
	eyeAspectRatio: number;
	pupilDilation: number;
	squintIntensity: number;
	eyeAge: number;
	faceAge: number;
}

// History data interface
export interface HistoryData {
	hourly: EyeTrackingMetrics[];
	daily: EyeTrackingMetrics[];
	monthly: EyeTrackingMetrics[];
	yearly: EyeTrackingMetrics[];
}

// User profile interface
export interface UserProfile {
	name: string;
	age: number;
	eyeAge: number;
	totalSessions: number;
	createdAt: string;
	lastActive: string;
	faceAge: number;
}

// Eye tracking state interface
export interface EyeTrackingState {
	error: string | null;
	currentMetrics: EyeTrackingMetrics;
	metricsHistory: EyeTrackingMetrics[];
	history: HistoryData;
	selectedTimeframe: 'hourly' | 'daily' | 'monthly' | 'yearly';
	selectedDate: string | null;
	profile: UserProfile;
	sessionStartTime: string | null;
}

// Eye tracking actions interface
export interface EyeTrackingActions {
	setError: (error: string | null) => void;
	updateMetrics: (metrics: Partial<EyeTrackingMetrics>) => void;
	setTimeframe: (timeframe: 'hourly' | 'daily' | 'monthly' | 'yearly') => void;
	setSelectedDate: (date: string | null) => void;
	updateProfile: (profile: Partial<UserProfile>) => void;
	startSession: () => void;
	endSession: () => void;
	exportData: () => string;
	importData: (data: string) => void;
	clearHistory: () => void;
	getMetricsForDate: (date: string) => EyeTrackingMetrics[];
	getLastBlinkRate: () => number;
	getLastMetrics: () => EyeTrackingMetrics;
}

// Combined eye tracking slice type
export interface EyeTrackingSlice {
	eyeTracking: EyeTrackingState & EyeTrackingActions;
}

// Default values
const defaultMetrics: EyeTrackingMetrics = {
	timestamp: new Date().toISOString(),
	blinkRate: 0,
	perClose: 0,
	attentionFrac: 0,
	strainLevelIdx: 0,
	strainText: 'Low',
	tiredText: 'Low',
	attBinary: 0,
	eyeAspectRatio: 0,
	pupilDilation: 0,
	squintIntensity: 0,
	eyeAge: 0,
	faceAge: 0,
};

const defaultProfile: UserProfile = {
	name: 'User',
	age: 25,
	eyeAge: 25,
	faceAge: 25,
	totalSessions: 0,
	createdAt: new Date().toISOString(),
	lastActive: new Date().toISOString(),
};

const defaultHistory: HistoryData = {
	hourly: [],
	daily: [],
	monthly: [],
	yearly: [],
};

// Initial eye tracking state
const initialEyeTrackingState: EyeTrackingState = {
	error: null,
	currentMetrics: defaultMetrics,
	metricsHistory: [],
	history: defaultHistory,
	selectedDate: new Date().toISOString().split('T')[0],
	selectedTimeframe: 'hourly',
	profile: defaultProfile,
	sessionStartTime: null,
};

// Helper function to aggregate metrics
function aggregateMetrics(metrics: EyeTrackingMetrics[]): EyeTrackingMetrics {
	if (metrics.length === 0) return defaultMetrics;

	const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

	return {
		timestamp: new Date().toISOString(),
		blinkRate: Math.round(avg(metrics.map((m) => m.blinkRate))),
		perClose: Number(avg(metrics.map((m) => m.perClose)).toFixed(2)),
		attentionFrac: Number(avg(metrics.map((m) => m.attentionFrac)).toFixed(2)),
		strainLevelIdx: Math.round(avg(metrics.map((m) => m.strainLevelIdx))) as 0 | 1 | 2,
		strainText: metrics[metrics.length - 1].strainText,
		tiredText: metrics[metrics.length - 1].tiredText,
		attBinary: Math.round(avg(metrics.map((m) => m.attBinary))) as 0 | 1,
		eyeAspectRatio: Number(avg(metrics.map((m) => m.eyeAspectRatio)).toFixed(3)),
		pupilDilation: Number(avg(metrics.map((m) => m.pupilDilation)).toFixed(2)),
		squintIntensity: Number(avg(metrics.map((m) => m.squintIntensity)).toFixed(2)),
		eyeAge: Math.round(avg(metrics.map((m) => m.eyeAge))),
		faceAge: Math.round(avg(metrics.map((m) => m.faceAge))),
	};
}

// Create the eye tracking slice
const createEyeTrackingSlice: StateCreator<
	AppStoreState,
	[],
	[['zustand/persist', unknown]],
	EyeTrackingSlice
> = (set, get) => ({
	eyeTracking: {
		...initialEyeTrackingState,

		setError: (error) => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					error,
				},
			}));
		},

		updateMetrics: (newMetrics) => {
			const { currentMetrics, history, metricsHistory } = get().eyeTracking;
			const updatedMetrics = {
				...currentMetrics,
				...newMetrics,
				timestamp: new Date().toISOString(),
			};

			// Add to hourly history
			const newHourly = [...history.hourly, updatedMetrics];
			if (newHourly.length > 60) newHourly.shift();

			// Aggregate for daily (every 60 entries)
			const newDaily = [...history.daily];
			if (newHourly.length % 60 === 0 && newHourly.length > 0) {
				const avgMetrics = aggregateMetrics(newHourly.slice(-60));
				newDaily.push(avgMetrics);
				if (newDaily.length > 24) newDaily.shift();
			}

			// Aggregate for monthly (every 24 daily entries)
			const newMonthly = [...history.monthly];
			if (newDaily.length % 24 === 0 && newDaily.length > 0) {
				const avgMetrics = aggregateMetrics(newDaily.slice(-24));
				newMonthly.push(avgMetrics);
				if (newMonthly.length > 30) newMonthly.shift();
			}

			// Aggregate for yearly (every 30 monthly entries)
			const newYearly = [...history.yearly];
			if (newMonthly.length % 30 === 0 && newMonthly.length > 0) {
				const avgMetrics = aggregateMetrics(newMonthly.slice(-30));
				newYearly.push(avgMetrics);
				if (newYearly.length > 12) newYearly.shift();
			}

			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					currentMetrics: updatedMetrics,
					metricsHistory: [...metricsHistory, updatedMetrics],
					history: {
						hourly: newHourly,
						daily: newDaily,
						monthly: newMonthly,
						yearly: newYearly,
					},
				},
			}));
		},

		setTimeframe: (timeframe) => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					selectedTimeframe: timeframe,
				},
			}));
		},

		setSelectedDate: (date) => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					selectedDate: date,
				},
			}));
		},

		updateProfile: (profileUpdate) => {
			const { profile } = get().eyeTracking;
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					profile: {
						...profile,
						...profileUpdate,
						lastActive: new Date().toISOString(),
					},
				},
			}));
		},

		startSession: () => {
			const { profile } = get().eyeTracking;
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					sessionStartTime: new Date().toISOString(),
					profile: {
						...profile,
						totalSessions: profile.totalSessions + 1,
						lastActive: new Date().toISOString(),
					},
				},
			}));
		},

		endSession: () => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					sessionStartTime: null,
				},
			}));
		},

		exportData: () => {
			const state = get().eyeTracking;
			return JSON.stringify(
				{
					profile: state.profile,
					history: state.history,
					exportDate: new Date().toISOString(),
				},
				null,
				2
			);
		},

		importData: (data) => {
			try {
				const parsed = JSON.parse(data);
				if (parsed.profile && parsed.history) {
					set((state) => ({
						eyeTracking: {
							...state.eyeTracking,
							profile: parsed.profile,
							history: parsed.history,
						},
					}));
				}
			} catch (error) {
				set((state) => ({
					eyeTracking: {
						...state.eyeTracking,
						error: 'Failed to import data: Invalid format',
					},
				}));
			}
		},

		clearHistory: () => {
			set((state) => ({
				eyeTracking: {
					...state.eyeTracking,
					history: defaultHistory,
					metricsHistory: [],
				},
			}));
		},

		getMetricsForDate: (date) => {
			const { history, selectedTimeframe } = get().eyeTracking;
			const data = history[selectedTimeframe] || [];

			return data.filter((metric) => {
				const metricDate = new Date(metric.timestamp).toISOString().split('T')[0];
				return metricDate === date;
			});
		},

		getLastBlinkRate: () => {
			const { metricsHistory } = get().eyeTracking;
			const last = metricsHistory?.findLast((m) => m.blinkRate > 0);
			return last?.blinkRate || 0;
		},

		getLastMetrics: () => {
			const { metricsHistory } = get().eyeTracking;
			const last = metricsHistory?.findLast((m) => m.blinkRate > 0);
			return last || defaultMetrics;
		},
	},
});

export default createEyeTrackingSlice;
