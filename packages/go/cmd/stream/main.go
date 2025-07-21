package main

import (
	"lumi/stream/app"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(app.NewApp().Handler)
}
