import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { deleteUser } from '@lumi/core/users/users.service';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get('user_id');

	if (!userId) throw new Error('User ID not provided when attempting to delete user');
	await deleteUser(userId);

	console.log('Successfully deleted user with ID: ', userId);

	redirect('/');
}
