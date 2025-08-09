package datastructures

type Set struct {
	elements map[string]struct{}
}

func NewSet() *Set {
	return &Set{
		elements: make(map[string]struct{}),
	}
}

func (s *Set) Add(value string) {
	s.elements[value] = struct{}{}
}

func (s *Set) Remove(value string) {
	delete(s.elements, value)
}

func (s *Set) Contains(value string) bool {
	_, found := s.elements[value]
	return found
}

func (s *Set) Size() int {
	return len(s.elements)
}

func (s *Set) List() []string {
	keys := make([]string, 0, len(s.elements))
	for key := range s.elements {
		keys = append(keys, key)
	}
	return keys
}
