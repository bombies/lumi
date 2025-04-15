export type Nullable<T> = { [K in keyof T]: T[K] | null };

export type DeepNullable<T> = {
	[K in keyof T]: DeepNullable<T[K]> | null;
};

export type ValueType<T> = T extends Record<any, infer V> ? V : never;
