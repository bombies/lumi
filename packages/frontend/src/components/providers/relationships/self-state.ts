export type SelfStateData<S extends keyof SelfStateMap, P = InferredSelfStatePayload<S>> = {
	state: S;
	payload: P;
};

export type SelfStateMap = {
	viewingMomentMessages: SelfStateData<'viewingMomentMessages', { momentId: string }>;
};

export const states: (keyof SelfStateMap)[] = ['viewingMomentMessages'];

export type SelfState = (typeof states)[number];

export type InferredSelfState<T extends SelfState> = SelfStateMap[T];
export type InferredSelfStatePayload<T extends SelfState> = SelfStateMap[T]['payload'];
