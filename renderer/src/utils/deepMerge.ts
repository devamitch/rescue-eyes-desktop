export function deepMerge(target: any, source: any): any {
	// Preserve functions from target (current state)
	if (typeof target === 'function') {
		return target;
	}

	if (typeof source === 'function') {
		return target; // Keep original function
	}

	if (source === null || typeof source !== 'object') {
		return source;
	}

	if (Array.isArray(source)) {
		return source;
	}

	const result = { ...target };

	for (const key in source) {
		if (source.hasOwnProperty(key)) {
			if (typeof source[key] === 'object' && source[key] !== null) {
				result[key] = deepMerge(target[key] || {}, source[key]);
			} else if (typeof source[key] !== 'function') {
				result[key] = source[key];
			}
			// Functions are skipped, preserving the original from target
		}
	}

	return result;
}
