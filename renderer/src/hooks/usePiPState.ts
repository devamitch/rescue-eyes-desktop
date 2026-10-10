'use client';

import { PiPState } from '@/types/pip';
import { useState } from 'react';

export const usePiPState = (initialState: Partial<PiPState> = {}) => {
	const [state, setState] = useState<PiPState>({
		isVideoReady: false,
		isHovered: false,
		isActive: false,
		loading: false,
		error: null,
		cameraReady: false,
		...initialState,
	});

	const updateState = (newState: Partial<PiPState>) => {
		setState((prev) => ({ ...prev, ...newState }));
	};

	return {
		...state,
		updateState,
	};
};
