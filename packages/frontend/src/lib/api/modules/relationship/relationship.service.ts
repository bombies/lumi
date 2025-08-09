import type { ApiClient } from '@/lib/api/api';
import type { GetRelationshipRequestForUserDto, UpdateRelationshipDto } from '@/lib/api/modules/relationship/relationship.dto';
import type { Relationship, RelationshipRequest } from '@/lib/api/modules/relationship/relationship.model';
import type { User } from '@/lib/api/modules/user/user.model';
import type { InfiniteData } from '@/lib/api/types/dto.types';
import { ApiService } from '@/lib/api/modules/service';

export class RelationshipService extends ApiService {
	constructor(api: ApiClient) {
		super(api, 'relationships');
	}

	sendRelationshipRequest(receiverId: string) {
		return this.api.post<RelationshipRequest>(this.endpoint(`/send/${receiverId}`), undefined);
	}

	acceptRelationshipRequest(requestId: string) {
		return this.api.post<RelationshipRequest>(this.endpoint(`/accept/${requestId}`), undefined);
	}

	rejectRelationshipRequest(requestId: string) {
		return this.api.post<RelationshipRequest>(this.endpoint(`/reject/${requestId}`), undefined);
	}

	getSentRelationshipRequests(data: GetRelationshipRequestForUserDto) {
		return this.api.get<InfiniteData<RelationshipRequest>>(this.endpoint(`/sent`, data));
	}

	getReceivedRelationshipRequests(data: GetRelationshipRequestForUserDto) {
		return this.api.get<InfiniteData<RelationshipRequest>>(this.endpoint(`/received`, data));
	}

	getRelationship() {
		return this.api.get<Relationship>(this.endpoint(undefined));
	}

	updateRelationship(dto: UpdateRelationshipDto) {
		return this.api.patch<Relationship>(this.endpoint(undefined), dto);
	}

	getRelationshipPartner() {
		return this.api.get<User>(this.endpoint('/partner'));
	}

	leaveRelationship() {
		return this.api.get<Relationship>(this.endpoint('/leave'));
	}
}
