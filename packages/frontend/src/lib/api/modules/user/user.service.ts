import type { User } from '@lumi/core/users/user.types';
import type { ApiClient } from '@/lib/api/api';
import type { GetUsersByEmailDto, GetUsersByUsernameDto, UpdateUserDto } from '@/lib/api/modules/user/user.dto';
import type { PresignedURLResponse } from '@/lib/api/types/api.types';
import type { GetUploadUrlDto, InfiniteData } from '@/lib/api/types/dto.types';
import { ApiService } from '@/lib/api/modules/service';

export class UserService extends ApiService {
	constructor(api: ApiClient) {
		super(api, 'users');
	}

	async getUsersByUsername(dto: GetUsersByUsernameDto) {
		return this.api.get<InfiniteData<User>>(this.endpoint('/username', dto));
	}

	async getUsersByEmail(dto: GetUsersByEmailDto) {
		return this.api.get<InfiniteData<User>>(this.endpoint('/email', dto));
	}

	async updateSelf(dto: UpdateUserDto) {
		return this.api.patch<User>(this.endpoint('/self'), dto);
	}

	async getSelf() {
		return this.api.get<User>(this.endpoint('/self'));
	}

	async deleteSelf() {
		return this.api.delete<boolean>(this.endpoint('/self'));
	}

	async getUserAvatarUploadUser(params: GetUploadUrlDto) {
		return this.api.get<PresignedURLResponse>(this.endpoint('/avatar-upload-url', params));
	}

	async getUserById(id: string) {
		return this.api.get<User>(this.endpoint(`/${id}`));
	}
}
