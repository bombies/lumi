import type { ApiClient } from '@/lib/api/api';
import type {
	CreateMomentDetailsDto,
	CreateMomentMessageDto,
	CreateMomentTagDto,
	GetInfiniteMomentMessagesDto,
	GetInfiniteMomentsDto,
	GetRelationshipMomentTagsDto,
	ReactToMessageDto,
	SearchMomentsDto,
	UpdateMomentDetailsDto,
	UpdateMomentMessageDto,
} from '@/lib/api/modules/moment/moment.dto';
import type { Moment, MomentMessage, MomentTag, RelationshipMomentTag } from '@/lib/api/modules/moment/moment.model';
import type { PresignedURLResponse } from '@/lib/api/types/api.types';
import type { InfiniteData, TupledInfiniteData } from '@/lib/api/types/dto.types';
import { ApiService } from '@/lib/api/modules/service';

export class MomentService extends ApiService {
	constructor(api: ApiClient) {
		super(api, 'moments');
	}

	createMomentDetails(dto: CreateMomentDetailsDto) {
		return this.api.post<Moment>(this.endpoint(undefined), dto);
	}

	getMomentDetails(momentId: string) {
		return this.api.get<Moment>(this.endpoint(`/${momentId}`));
	}

	updateMomentDetails(momentId: string, dto: UpdateMomentDetailsDto) {
		return this.api.patch<Moment>(this.endpoint(`/${momentId}`), dto);
	}

	deleteMomentDetails(momentId: string) {
		return this.api.delete<boolean>(this.endpoint(`/${momentId}`));
	}

	getMoments(dto: GetInfiniteMomentsDto) {
		return this.api.get<InfiniteData<Moment>>(this.endpoint(undefined, dto));
	}

	searchMoments(dto: SearchMomentsDto) {
		return this.api.get<TupledInfiniteData<Moment>>(this.endpoint('/search', dto));
	}

	createMomentMessage(momentId: string, dto: CreateMomentMessageDto) {
		return this.api.post<Moment>(this.endpoint(`/${momentId}/messages`), dto);
	}

	getMessagesForMoment(momentId: string, dto: GetInfiniteMomentMessagesDto) {
		return this.api.get<InfiniteData<MomentMessage>>(this.endpoint(`/${momentId}/messages`, dto));
	}

	editMomentMessage(momentId: string, messageId: string, dto: UpdateMomentMessageDto) {
		return this.api.patch<MomentMessage>(this.endpoint(`/${momentId}/messages/${messageId}`), dto);
	}

	deleteMomentMessage(momentId: string, messageId: string) {
		return this.api.delete<boolean>(this.endpoint(`/${momentId}/messages/${messageId}`));
	}

	reactToMessage(momentId: string, messageId: string, dto: ReactToMessageDto) {
		return this.api.put<MomentMessage>(this.endpoint(`/${momentId}/messages/${messageId}/react`), dto);
	}

	getRelationshipMomentMomentTags(dto: GetRelationshipMomentTagsDto) {
		return this.api.get<InfiniteData<RelationshipMomentTag>>(this.endpoint('/tags', dto));
	}

	createRelationshipMomentTag(dto: CreateMomentTagDto) {
		return this.api.post<RelationshipMomentTag>(this.endpoint('/tags'), dto);
	}

	deleteRelationshipMomentTag(tag: string) {
		return this.api.delete<boolean>(this.endpoint(`/tags/${tag}`));
	}

	getTagsForMoment(momentId: string) {
		return this.api.get<MomentTag[]>(this.endpoint(`/${momentId}/tags`));
	}

	createTagForMoment(momentId: string, dto: CreateMomentTagDto) {
		return this.api.post<MomentTag>(this.endpoint(`/${momentId}/tags`), dto);
	}

	deleteTagForMoment(momentId: string, tag: string) {
		return this.api.delete<boolean>(this.endpoint(`/${momentId}/tags/${tag}`));
	}

	getMomentUploadUrl() {
		return this.api.get<PresignedURLResponse>(this.endpoint('/upload-url'));
	}
}
