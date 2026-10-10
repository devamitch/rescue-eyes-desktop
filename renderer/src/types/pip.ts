export interface PiPControlHandlers {
	onToggleTracking: () => void;
	onToggleExpanded: () => void;
	onToggleFullScreen: () => void;
}

export interface PiPState {
	isVideoReady: boolean;
	isHovered: boolean;
	isActive: boolean;
	loading: boolean;
	error: string | null;
	cameraReady: boolean;
}
