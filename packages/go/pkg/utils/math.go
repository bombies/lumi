package utils

type Number interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 | ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~float32 | ~float64
}

func Max[T Number](x, y T) T {
	if x < y {
		return y
	}
	return x
}

func Min[T Number](x, y T) T {
	if x > y {
		return y
	}
	return x
}
