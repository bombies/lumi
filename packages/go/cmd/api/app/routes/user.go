package routes

import (
	"lumi/api/app/utils"
	"lumi/pkg/models"
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
	protectedRouter := route.ProtectedGroup

	router.GET(route.endpoint("/username"), route.getUsersByUsername)
	router.GET(route.endpoint("/email"), route.getUsersByEmail)
	protectedRouter.PATCH(route.endpoint("/self"), route.updateSelf)
	protectedRouter.GET(route.endpoint("/self"), route.getSelf)
	protectedRouter.DELETE(route.endpoint("/self"), route.deleteSelf)
	protectedRouter.GET(route.endpoint("/avatar-upload-url"), route.getUserAvatarUploadUser)
	protectedRouter.GET(route.endpoint("/:id"), route.getStrippedUserById)
}

func (route *UserRoute) endpoint(path ...string) string {
	return buildEndpointString("users", path...)
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
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.UserService.UpdateUser(c, claims.Id, *dto)
		},
	)
}

func (route *UserRoute) getSelf(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.UserService.GetUserById(c, user.GetUserByIdArgs{
				UserId: claims.Id,
			})
		},
	)
}

func (route *UserRoute) getUserAvatarUploadUser(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*models.GetUploadUrlDto, error) {
			return utils.ParseQueryParams[models.GetUploadUrlDto](c)
		},
		func(input *models.GetUploadUrlDto) (any, error) {
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.UserService.GetUserAvatarUploadUrl(c, user.GetUserAvatarUploadUrlArgs{
				GetUploadUrlDto: *input,
				UserId:          claims.Id,
			})
		},
	)
}

func (route *UserRoute) getStrippedUserById(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			userId := c.Param("id")
			return route.UserService.GetUserById(c, user.GetUserByIdArgs{
				UserId:      userId,
				Projections: []string{"id", "firstName", "lastName", "avatarUrl", "avatarKey", "username"},
			})
		},
	)
}

func (route *UserRoute) deleteSelf(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.UserService.DeleteUser(c, claims.Id)
		},
	)
}
