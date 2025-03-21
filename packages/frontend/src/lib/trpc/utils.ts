import { TRPCClientError, TRPCClientErrorLike } from '@trpc/client';
import { AnyTRPCClientTypes, TRPCError } from '@trpc/server';
import { toast } from 'sonner';

type GetErrorMessageArgs = {
	defaultMessage?: string;
	useErrorObjectMessage?: boolean;
};

export const getErrorMessage = (e: any, args?: GetErrorMessageArgs) => {
	if (e instanceof TRPCClientError || e instanceof TRPCError) {
		return e.message;
	} else if (e instanceof Error && args?.useErrorObjectMessage) {
		return e.message;
	} else {
		return args?.defaultMessage || 'Something went wrong!';
	}
};

export const handleTrpcError = (e: any, args?: GetErrorMessageArgs) => {
	toast.error(getErrorMessage(e, args));
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
