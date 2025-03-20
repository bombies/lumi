export type Params<T> = {
	params: T;
};
export type AsyncParams<T> = {
	params: Promise<T>;
};
