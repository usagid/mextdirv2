type UmamiTracker = {
	track: (event: string, data?: Record<string, string>) => void;
};

type UmamiWindow = Window & {
	umami?: UmamiTracker;
};

export function useUmami() {
	function track(event: string, data?: Record<string, string>) {
		if (!import.meta.client) return;
		const tracker = (window as UmamiWindow).umami;
		tracker?.track(event, data);
	}

	return { track };
}
