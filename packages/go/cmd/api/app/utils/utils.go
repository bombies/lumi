package utils

import (
	"errors"
	"log"
	"lumi/pkg/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ParseDto[T any](c *gin.Context) (*T, error) {
	var dto T
	if err := c.BindJSON(dto); err != nil {
		return nil, err
	}

	return &dto, nil
}

func ParseQueryParams[T any](c *gin.Context) (*T, error) {
	var dto T
	if err := c.ShouldBindQuery(dto); err != nil {
		return nil, err
	}

	return &dto, nil
}

func HandleResponse[I any](c *gin.Context, inputHandler func() (*I, error), responseHandler func(input *I) (any, error)) {
	var dto *I
	var err error

	if inputHandler != nil {
		dto, err = inputHandler()
	}

	if err != nil {
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	if dto == nil && inputHandler != nil {
		log.Println(errors.New("dto is nil but the input handler isn't"))
		c.AbortWithStatusJSON(
			http.StatusInternalServerError,
			gin.H{
				"code":    http.StatusInternalServerError,
				"message": "Internal server error",
			},
		)
		return
	}

	response, err := responseHandler(dto)

	if err != nil {
		switch err := err.(type) {
		case *models.ServiceError:
			c.AbortWithStatusJSON(err.StatusCode, err)
			return
		default:
			c.AbortWithStatusJSON(
				http.StatusInternalServerError,
				gin.H{
					"code":    http.StatusInternalServerError,
					"message": "Internal server error",
				},
			)
			return
		}
	}

	c.JSON(http.StatusOK, response)
}
