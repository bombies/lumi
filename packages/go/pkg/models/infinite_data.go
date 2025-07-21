package models

type InfiniteDataDto interface {
	GetLimit() int
	GetCursor() map[string]any
}
