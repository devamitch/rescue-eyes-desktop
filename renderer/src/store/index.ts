import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Import slices
import { customEncryptedStorage } from './encryption';
import createApiSlice, { ApiSlice } from './slices/api.slice';
import createAuthSlice, { AuthSlice } from './slices/auth.slice';
import createCameraSlice, { type CameraSlice } from './slices/camera.slice';
import createEyeTrackingSlice, { type EyeTrackingSlice } from './slices/eye-tracking.slice';
import createFirebaseSlice, { type FirebaseSlice } from './slices/firebase.slice';
import createScreenTimeSlice, { type ScreenTimeSlice } from './slices/screen-time.slice';
import createSocketSlice, { SocketSlice } from './slices/socket.slice';
import { deepMerge } from '@/utils/deepMerge';

// Combined store state
export type AppStoreState = ApiSlice &
	AuthSlice &
	CameraSlice &
	ScreenTimeSlice &
	EyeTrackingSlice &
	SocketSlice &
	SocketSlice &
	FirebaseSlice;

export const useAppStore = create<AppStoreState>()(
	devtools(
		persist(
			immer((...a) => ({
				...createCameraSlice(...a),
				...createScreenTimeSlice(...a),
				...createEyeTrackingSlice(...a),
				...createFirebaseSlice(...a),
				...createAuthSlice(...a),
				...createApiSlice(...a),
				...createSocketSlice(...a),
			})),
			{
				name: 'a-eye-scan-storage',
				version: 2,
				storage: customEncryptedStorage,
				merge: (persistedState, currentState) => deepMerge(currentState, persistedState),
			}
		)
	)
);

export const useBoundStore = create<AppStoreState>((...a) => ({
	...createCameraSlice(...a),
	...createScreenTimeSlice(...a),
	...createEyeTrackingSlice(...a),
	...createFirebaseSlice(...a),
	...createAuthSlice(...a),
	...createApiSlice(...a),
	...createSocketSlice(...a),
}));

export const useBearStore = create<AppStoreState>()(
	persist(
		(...a) => ({
			...createCameraSlice(...a),
			...createScreenTimeSlice(...a),
			...createEyeTrackingSlice(...a),
			...createFirebaseSlice(...a),
			...createAuthSlice(...a),
			...createApiSlice(...a),
			...createSocketSlice(...a),
		}),
		{
			name: 'food-storage', // name of the item in the storage (must be unique)
			storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
		}
	)
);
export default useAppStore;
