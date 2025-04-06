import { AbstractDbKeys } from '../../utils/dynamo/abstract.keys';
import { RelationshipMomentTagDbKeys } from './relationship-moment-tag.keys';

export class MomentTagDbKeys extends AbstractDbKeys {
	readonly relationshipMomentTagDbKeys = new RelationshipMomentTagDbKeys();

	constructor() {
		super('moment::tag#');
	}

	pk(momentId: string) {
		return this.buildKey(momentId);
	}

	sk(tag: string) {
		return this.buildKey(tag);
	}

	gsi1pk(relationshipId: string) {
		return this.relationshipMomentTagDbKeys.pk(relationshipId);
	}

	gsi1sk(tag: string) {
		return tag;
	}
}
