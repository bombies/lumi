package routes

import "fmt"

type Route interface {
	RegisterEndpoints()
}

func buildEndpointString(prefix string, endpoint ...string) string {
	if len(endpoint) == 0 {
		return fmt.Sprintf("/%s", prefix)
	}
	return fmt.Sprintf("/%s%s", prefix, endpoint[0])
}
