package models

type ServiceError struct {
	StatusCode int    `json:"code"`
	Message    string `json:"message"`
}

func (e *ServiceError) Error() string {
	return e.Message
}
