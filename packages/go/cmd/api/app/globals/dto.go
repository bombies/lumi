package globals

type SingleInputDTO[T any] struct {
	Input T `json:"input"`
}
