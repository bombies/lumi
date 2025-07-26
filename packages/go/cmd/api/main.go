package main

import (
	"lumi/api/app"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(app.NewApp().Handler)
}
