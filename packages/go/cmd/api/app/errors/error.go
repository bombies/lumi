package apierr

type MissingTokenError struct{}

func (e MissingTokenError) Error() string {
	return "Missing bearer token"
}
