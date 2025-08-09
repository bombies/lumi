import type { ApiClient } from '@/lib/api/api';
import type { CreateSongRecommendationDto, GetSongRecommendationDto, UpdateSongRecommendationDto } from '@/lib/api/modules/music/music.dto';
import type { SongRecommendation } from '@/lib/api/modules/music/music.model';
import type { InfiniteData } from '@/lib/api/types/dto.types';
import { ApiService } from '@/lib/api/modules/service';

export class MusicService extends ApiService {
	constructor(api: ApiClient) {
		super(api, 'music');
	}

	createSongRecommendation(dto: CreateSongRecommendationDto) {
		return this.api.post<SongRecommendation>(this.endpoint(undefined), dto);
	}

	getSongRecommendations(dto: GetSongRecommendationDto) {
		return this.api.get<InfiniteData<SongRecommendation>>(this.endpoint(undefined, dto));
	}

	getSelfSongRecommendations(dto: GetSongRecommendationDto) {
		return this.api.get<InfiniteData<SongRecommendation>>(this.endpoint('/self', dto));
	}

	getRelationshipSongRecommendations(dto: GetSongRecommendationDto) {
		return this.api.get<InfiniteData<SongRecommendation>>(this.endpoint('/relationship', dto));
	}

	updateSongRecommendation(songRecommendationId: string, dto: UpdateSongRecommendationDto) {
		return this.api.patch<SongRecommendation>(this.endpoint(`/${songRecommendationId}`), dto);
	}

	deleteSongRecommendation(songRecommendationId: string) {
		return this.api.delete<SongRecommendation>(this.endpoint(`/${songRecommendationId}`));
	}
}
