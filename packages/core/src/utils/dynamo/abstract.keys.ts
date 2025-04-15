export abstract class AbstractDbKeys {
	constructor(readonly prefix: string) {}

	buildKey(...suffix: string[]) {
		return `${this.prefix}${suffix.join('#')}`;
	}
}
