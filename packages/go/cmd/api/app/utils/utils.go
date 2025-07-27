package utils

import (
	"errors"
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
		c.AbortWithStatusJSON(
			http.StatusInternalServerError,
			gin.H{
				"code":    http.StatusInternalServerError,
				"message": "Internal server error",
			},
		)
	}

	response, err := responseHandler(dto)

	if err != nil {
		var serviceError *models.ServiceError
		if errors.As(err, &serviceError) {
			c.JSON(serviceError.StatusCode, serviceError)
			return
		}

		c.AbortWithStatusJSON(
			http.StatusInternalServerError,
			gin.H{
				"code":    http.StatusInternalServerError,
				"message": "Internal server error",
			},
		)
		return
	}

	c.JSON(http.StatusOK, response)
}
