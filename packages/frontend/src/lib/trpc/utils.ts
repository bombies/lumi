import { TRPCClientError, TRPCClientErrorLike } from '@trpc/client';
import { AnyTRPCClientTypes, TRPCError } from '@trpc/server';
import { toast } from 'sonner';

export const getErrorMessage = (e: any, defaultMessage: string = 'Something went wrong!') => {
	if (e instanceof TRPCClientError || e instanceof TRPCError) {
		return e.message;
	} else {
		return defaultMessage;
	}
};

export const handleTrpcError = (
	e: any,
	args?: {
		defaultMessage?: string;
		useErrorObjectMessage?: boolean;
	},
) => {
	if (e instanceof TRPCClientError || e instanceof TRPCError) {
		toast.error(e.message);
	} else if (args?.useErrorObjectMessage && e instanceof Error) {
		toast.error(e.message);
	} else {
		toast.error(args?.defaultMessage || 'Something went wrong!');
	}

	throw e;
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
