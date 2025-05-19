import { AbstractDbKeys } from '../utils/dynamo/abstract.keys';

export class ImportantDateDbKeys extends AbstractDbKeys {
	constructor(prefix: string) {
		super(prefix);
	}

	pk(relationshipId: string) {
		return this.buildKey(relationshipId);
	}

	sk(eventId: string) {
		return this.buildKey(eventId);
	}

	gsi1pk(relationshipId: string) {
		return this.buildKey(relationshipId);
	}

	gsi1sk(mmDD: string, eventId: string) {
		return this.buildKey(mmDD, 'event', eventId);
	}

	gsi2pk() {
		return this.prefix;
	}

	gsi2sk(mmDD: string, eventId: string) {
		return this.buildKey(mmDD, 'event', eventId);
	}
}
