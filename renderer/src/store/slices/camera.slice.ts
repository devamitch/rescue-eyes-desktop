import type { StateCreator, StoreMutators } from 'zustand';
import { AppStoreState } from '..';

// Camera state interface
export interface CameraState {
	isCameraActive: boolean;
	loading: boolean;
	cameraError: string | null;
	cameraPermission: 'prompt' | 'granted' | 'denied' | 'checking';
	isTrackingActive: boolean;
	trackingError: string | null;
	cameraConfig: {
		width: number;
		height: number;
		facingMode: 'user' | 'environment';
	};
}

// Camera actions interface
export interface CameraActions {
	setCameraState: (
		state: Partial<Pick<CameraState, 'isCameraActive' | 'cameraError' | 'cameraPermission'>>
	) => void;
	setTrackingState: (
		state: Partial<Pick<CameraState, 'isTrackingActive' | 'trackingError'>>
	) => void;
	setCameraConfig: (config: Partial<CameraState['cameraConfig']>) => void;
	restoreCameraState: () => Promise<MediaStream | undefined>;
	setLoading: (loading: boolean) => void;
}

// Combined camera slice type
export interface CameraSlice {
	camera: CameraState & CameraActions;
}

// Default camera config
const defaultCameraConfig = {
	width: 640,
	height: 480,
	facingMode: 'user' as const,
};

// Initial camera state
const initialCameraState: CameraState = {
	isCameraActive: false,
	loading: false,
	cameraError: null,
	cameraPermission: 'prompt',
	isTrackingActive: false,
	trackingError: null,
	cameraConfig: defaultCameraConfig,
};

// Create the camera slice
const createCameraSlice: StateCreator<
	AppStoreState,
	[],
	[['zustand/persist', unknown]],
	CameraSlice
> = (set, get) => ({
	camera: {
		...initialCameraState,

		setLoading: (loading) => {
			set((state) => ({
				camera: {
					...state.camera,
					loading,
				},
			}));
		},

		setCameraState: (newState) => {
			set((state) => ({
				camera: {
					...state.camera,
					...newState,
				},
			}));
		},

		setTrackingState: (newState) => {
			set((state) => ({
				camera: {
					...state.camera,
					...newState,
				},
			}));
		},

		setCameraConfig: (config) => {
			set((state) => ({
				camera: {
					...state.camera,
					cameraConfig: { ...state.camera.cameraConfig, ...config },
				},
			}));
		},

		restoreCameraState: async () => {
			const { isCameraActive, cameraConfig } = get().camera;
			if (isCameraActive) {
				try {
					const stream = await navigator.mediaDevices.getUserMedia({
						video: {
							width: cameraConfig.width,
							height: cameraConfig.height,
							facingMode: cameraConfig.facingMode,
						},
					});
					return stream;
				} catch (error) {
					console.error('Failed to restore camera:', error);
					set((state) => ({
						camera: {
							...state.camera,
							isCameraActive: false,
							cameraError: 'Failed to restore camera after refresh',
						},
					}));
				}
			}
		},
	},
});

export default createCameraSlice;
