import type { StateCreator } from 'zustand';
import { AppStoreState } from '..';

// Screen time state interface
export interface ScreenTimeState {
	loginTime: string | null;
	dailyScreenTime: number;
	screenTimeByHour: number[];
	lastResetDate: string;
}

// Screen time actions interface
export interface ScreenTimeActions {
	startScreenTime: () => void;
	updateScreenTime: () => void;
	resetDailyScreenTime: () => void;
	checkAndResetScreenTime: () => void;
}

// Combined screen time slice type
export interface ScreenTimeSlice {
	screenTime: ScreenTimeState & ScreenTimeActions;
}

// Initial screen time state
const initialScreenTimeState: ScreenTimeState = {
	loginTime: null,
	dailyScreenTime: 0,
	screenTimeByHour: Array(24).fill(0),
	lastResetDate: new Date().toISOString().split('T')[0],
};

// Create the screen time slice
const createScreenTimeSlice: StateCreator<
	AppStoreState,
	[],
	[['zustand/persist', unknown]],
	ScreenTimeSlice
> = (set, get) => ({
	screenTime: {
		...initialScreenTimeState,

		startScreenTime: () => {
			try {
				const { checkAndResetScreenTime } = get?.()?.screenTime;
				checkAndResetScreenTime?.();

				const now = new Date();
				set((state) => ({
					screenTime: {
						...state.screenTime,
						loginTime: now?.toISOString(),
					},
				}));

				const intervalId = setInterval(() => {
					get?.()?.screenTime?.updateScreenTime?.();
				}, 60000);

				(window as any).screenTimeInterval = intervalId;
			} catch (e) {
				console.error('Error starting screen time tracking', e);
			}
		},

		updateScreenTime: () => {
			const { loginTime, dailyScreenTime, screenTimeByHour, checkAndResetScreenTime } =
				get().screenTime;
			checkAndResetScreenTime();

			if (loginTime) {
				const now = new Date();
				const hour = now.getHours();
				const newTotal = dailyScreenTime + 60;
				const updatedByHour = [...screenTimeByHour];
				updatedByHour[hour] = (updatedByHour[hour] || 0) + 1;

				set((state) => ({
					screenTime: {
						...state.screenTime,
						dailyScreenTime: newTotal,
						loginTime: now.toISOString(),
						screenTimeByHour: updatedByHour,
					},
				}));
			}
		},

		resetDailyScreenTime: () => {
			if ((window as any).screenTimeInterval) {
				clearInterval((window as any).screenTimeInterval);
			}
			const today = new Date().toISOString().split('T')[0];
			set((state) => ({
				screenTime: {
					...state.screenTime,
					dailyScreenTime: 0,
					loginTime: null,
					lastResetDate: today,
					screenTimeByHour: Array(24).fill(0),
				},
			}));
		},

		checkAndResetScreenTime: () => {
			const { lastResetDate, resetDailyScreenTime } = get().screenTime;
			const today = new Date().toISOString().split('T')[0];

			if (lastResetDate !== today) {
				resetDailyScreenTime();
			}
		},
	},
});

export default createScreenTimeSlice;
