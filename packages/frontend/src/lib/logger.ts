class Logger {
	private readonly isDevMode: boolean
		= process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true';

	private getTimestamp() {
		const datetime = new Date();
		return (
			`${datetime.toLocaleTimeString('en-US', {
				timeStyle: 'medium',
				hourCycle: 'h24',
			})} `
		);
	}

	public debug(message: string, ...optionalParams: any[]) {
		if (this.isDevMode) {
			console.debug(
				`%c${this.getTimestamp()}%c[DEBUG]%c ${message}`,
				'color:gray',
				'color:goldenrod',
				'color:white',
				...optionalParams,
			);
		}
	}

	public info(message: string, ...optionalParams: any[]) {
		console.info(
			`%c${this.getTimestamp()}%c[INFO]%c ${message}`,
			'color:gray',
			'color:cyan',
			'color:white',
			...optionalParams,
		);
	}

	public warn(message: string, ...optionalParams: any[]) {
		console.warn(`${this.getTimestamp()}[WARN] ${message}`, ...optionalParams);
	}

	public error(message: string, ...optionalParams: any[]) {
		console.error(`${this.getTimestamp()}[ERROR] ${message}`, ...optionalParams);
	}

	public log(message: string, ...optionalParams: any[]) {
		console.log(`${this.getTimestamp()}[LOG] ${message}`, ...optionalParams);
	}

	public trace(message: string, ...optionalParams: any[]) {
		console.trace(`${this.getTimestamp()}[TRACE] ${message}`, ...optionalParams);
	}

	public assert(condition?: boolean, message?: string, ...data: any[]) {
		console.assert(`${this.getTimestamp()}[ASSERT] ${condition}`, message, ...data);
	}

	public clear() {
		console.clear();
	}
}

export const logger = new Logger();
