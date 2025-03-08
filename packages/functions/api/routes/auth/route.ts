import { registerUserDto } from '@lumi/core/auth/auth.dto';
import {
	generateOTP,
	generateOTPForUserId,
	registerUser,
	verifyOTPForUser,
} from '@lumi/core/auth/auth.service';
import { sendAuthCodeEmail } from '@lumi/emails/auth/code';
import { z } from 'zod';

import { protectedProcedure, publicProcedure, router } from '../../utils/trpc';

export const authRouter = router({
	register: publicProcedure
		.input(
			registerUserDto.and(
				z
					.object({
						args: z
							.object({
								sendOTP: z.boolean().optional(),
							})
							.optional(),
					})
					.optional(),
			),
		)
		.mutation(async ({ input: { args, ...input } }) => {
			const registeredUser = await registerUser(input);
			if (args?.sendOTP) {
				const otp = await generateOTP(registeredUser);
				await sendAuthCodeEmail({
					email: registeredUser.email,
					code: otp.code,
				});
			}
			return registerUser;
		}),

	sendOTP: protectedProcedure.mutation(async ({ ctx: { user } }) => {
		const otp = await generateOTPForUserId(user.id);
		await sendAuthCodeEmail({
			email: user.email!,
			code: otp.code,
		});
	}),

	verifyOTP: protectedProcedure
		.input(z.string())
		.mutation(({ input: code, ctx: { user } }) => {
			return verifyOTPForUser(user.id, code);
		}),
});
