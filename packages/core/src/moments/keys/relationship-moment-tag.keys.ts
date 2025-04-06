import { AbstractDbKeys } from '../../utils/dynamo/abstract.keys';

export class RelationshipMomentTagDbKeys extends AbstractDbKeys {
	constructor() {
		super('relationship::moment::tag#');
	}

	pk(relationshipId: string) {
		return this.buildKey(relationshipId);
	}

	sk(tag: string) {
		return this.buildKey(tag);
	}
}
