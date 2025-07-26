package routes

import (
	"lumi/api/app/utils"
	"lumi/pkg/models/user"

	"github.com/gin-gonic/gin"
)

type UserRoute struct {
	Router         *gin.Engine
	ProtectedGroup *gin.RouterGroup
	UserService    *user.UserService
}

func (route *UserRoute) RegisterEndpoints() {
	router := route.Router

	router.GET("/users/username", route.getUsersByUsername)
	router.GET("/users/email", route.getUsersByEmail)
	router.PATCH("/users/self", route.updateSelf)
}

func (route *UserRoute) getUsersByUsername(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*user.GetUsersByUsernameDto, error) {
			return utils.ParseQueryParams[user.GetUsersByUsernameDto](c)
		},
		func(dto *user.GetUsersByUsernameDto) (any, error) {
			return route.UserService.GetUsersByUsername(c, *dto)
		},
	)
}

func (route *UserRoute) getUsersByEmail(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*user.GetUsersByEmailDto, error) {
			return utils.ParseQueryParams[user.GetUsersByEmailDto](c)
		},
		func(dto *user.GetUsersByEmailDto) (any, error) {
			return route.UserService.GetUsersByEmail(c, *dto)
		},
	)
}

func (route *UserRoute) updateSelf(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*user.UpdateUserDto, error) {
			return utils.ParseDto[user.UpdateUserDto](c)
		},
		func(dto *user.UpdateUserDto) (any, error) {
			// TODO: Inject userId from protected context
			return route.UserService.UpdateUser(c, "", *dto)
		},
	)
}
