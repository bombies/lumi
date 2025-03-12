class Logger {
	private readonly isDevMode: boolean =
		process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true';

	public debug(message: string, ...optionalParams: any[]) {
		if (this.isDevMode) {
			console.debug('[DEBUG] ' + message, ...optionalParams);
		}
	}

	public info(message: string, ...optionalParams: any[]) {
		console.info('[INFO] ' + message, ...optionalParams);
	}

	public warn(message: string, ...optionalParams: any[]) {
		console.warn('[WARN] ' + message, ...optionalParams);
	}

	public error(message: string, ...optionalParams: any[]) {
		console.error('[ERROR] ' + message, ...optionalParams);
	}

	public log(message: string, ...optionalParams: any[]) {
		console.log('[LOG] ' + message, ...optionalParams);
	}

	public trace(message: string, ...optionalParams: any[]) {
		console.trace('[TRACE] ' + message, ...optionalParams);
	}

	public assert(condition?: boolean, message?: string, ...data: any[]) {
		console.assert('[ASSERT] ' + condition, message, ...data);
	}

	public clear() {
		console.clear();
	}
}

export const logger = new Logger();
