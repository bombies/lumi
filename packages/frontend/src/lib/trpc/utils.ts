import { TRPCClientError, TRPCClientErrorLike } from '@trpc/client';
import { AnyTRPCClientTypes, TRPCError } from '@trpc/server';
import { toast } from 'sonner';

export const handleTrpcError = (e: any, defaultMessage: string = 'Something went wrong!') => {
	if (e instanceof TRPCClientError || e instanceof TRPCError) {
		toast.error(e.message);
	} else {
		console.error(e);
		toast.error(defaultMessage);
	}
};

export const onGenericTrpcError = <T extends AnyTRPCClientTypes>(
	error: TRPCClientErrorLike<T>,
	{
		defaultMessage = 'Something went wrong!',
	}: {
		defaultMessage?: string;
	},
) => {
	toast.error(error.message || defaultMessage);
};
