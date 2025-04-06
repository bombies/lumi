import { AbstractDbKeys } from '../../utils/dynamo/abstract.keys';

export class MomentDbKeys extends AbstractDbKeys {
	constructor() {
		super('moment::details#');
	}

	pk(momentId: string) {
		return this.buildKey(momentId);
	}

	sk(momentId: string) {
		return this.buildKey(momentId);
	}

	gsi1pk(relationshipId: string) {
		return this.buildKey(relationshipId);
	}

	gsi1sk(timestamp: string) {
		return this.buildKey(timestamp);
	}

	gsi2pk(userId: string) {
		return this.buildKey(userId);
	}

	gsi2sk(timestamp: string) {
		return this.buildKey(timestamp);
	}
}
