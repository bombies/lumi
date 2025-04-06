import { AbstractDbKeys } from "../../utils/dynamo/abstract.keys";

export class MomentMessageDbKeys extends AbstractDbKeys {
	constructor() {
		super('moment::message#');
	}

	pk(messageId: string) {
		return this.buildKey(messageId);
	}

	sk(messageId: string) {
		return this.buildKey(messageId);
	}

	gsi1pk(momentId: string) {
		return this.buildKey(momentId);
	}

	gsi1sk(timestamp: string) {
		return this.buildKey(timestamp);
	}
}
