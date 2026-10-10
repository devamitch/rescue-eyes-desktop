import { useEffect, useRef } from 'react';

interface RenderProfilerProps {
	name: string;
	logEnabled?: boolean;
}

export const useRenderProfiler = ({ name, logEnabled = true }: RenderProfilerProps) => {
	const renderCountRef = useRef(0);
	const lastRenderTimeRef = useRef(performance.now());
	const mountedRef = useRef(false);

	useEffect(() => {
		if (!mountedRef.current) {
			mountedRef.current = true;
			console.log(`🔵 [${name}] Component mounted`);
			return;
		}

		renderCountRef.current++;
		const now = performance.now();
		const timeSinceLastRender = now - lastRenderTimeRef.current;
		lastRenderTimeRef.current = now;

		if (logEnabled) {
			console.log(`🔄 [${name}] Render #${renderCountRef.current}`, {
				timeSinceLastRender: timeSinceLastRender.toFixed(2) + 'ms',
				timestamp: new Date().toISOString(),
			});
		}

		// Warn for rapid re-renders
		if (timeSinceLastRender < 16.7 && renderCountRef.current > 1) {
			// 60fps threshold
			console.warn(
				`🚨 [${name}] Rapid re-render detected: ${timeSinceLastRender.toFixed(2)}ms`
			);
		}

		return () => {
			console.log(`🔴 [${name}] Component unmounted after ${renderCountRef.current} renders`);
		};
	});
};
