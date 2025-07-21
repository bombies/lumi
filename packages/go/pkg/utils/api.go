package utils

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
)

type ResponseValues interface {
	// Can be adjusted as needed
	string
}

func InternalServerError(err error) events.APIGatewayV2HTTPResponse {
	fmt.Println("Something went wrong:", err)
	return ApiMessageResponse(http.StatusInternalServerError, "Internal server error")
}

func ApiResponse[V ResponseValues](statusCode int, body any) events.APIGatewayV2HTTPResponse {
	marshalledBody, _ := json.Marshal(body)
	return events.APIGatewayV2HTTPResponse{
		StatusCode: statusCode,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       string(marshalledBody),
	}
}

func ApiMessageResponse(statusCode int, message string) events.APIGatewayV2HTTPResponse {
	return ApiResponse(statusCode, map[string]string{"message": message})
}
