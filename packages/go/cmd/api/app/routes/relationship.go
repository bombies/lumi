package routes

import (
	"lumi/api/app/globals"
	"lumi/api/app/utils"
	"lumi/pkg/models/relationship"
	"lumi/pkg/models/user"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
)

type RelationshipRoute struct {
	Router              *gin.Engine
	ProtectedGroup      *gin.RouterGroup
	RelationshipRoute   gin.IRoutes
	UserService         *user.UserService
	RelationshipService *relationship.RelationshipService
}

func (route *RelationshipRoute) RegisterEndpoints() {
	protectedRouter := route.ProtectedGroup
	relationshipRouter := route.RelationshipRoute

	_ = relationshipRouter

	protectedRouter.POST("/relationships/send", route.SendRelationshipRequest)
	protectedRouter.POST("/relationships/accept", route.AcceptRelationshipRequest)
	protectedRouter.POST("/relationships/reject", route.RejectRelationshipRequest)
	protectedRouter.GET("/relationships/sent", route.GetSentRelationshipRequests)
	protectedRouter.GET("/relationships/received", route.GetReceivedRelationshipRequests)
	relationshipRouter.GET("/relationships", route.GetRelationship)
	relationshipRouter.GET("/relationships/partner", route.GetRelationshipPartner)
	relationshipRouter.POST("/relationships/leave", route.LeaveRelationship)
	relationshipRouter.PATCH("/relationships", route.UpdateRelationship)
}

func (route *RelationshipRoute) SendRelationshipRequest(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*globals.SingleInputDTO[string], error) {
			return utils.ParseDto[globals.SingleInputDTO[string]](c)
		},
		func(input *globals.SingleInputDTO[string]) (any, error) {
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.RelationshipService.SendRelationshipRequest(c, claims.Id, input.Input)
		},
	)
}

func (route *RelationshipRoute) AcceptRelationshipRequest(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*globals.SingleInputDTO[string], error) {
			return utils.ParseDto[globals.SingleInputDTO[string]](c)
		},
		func(input *globals.SingleInputDTO[string]) (any, error) {
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.RelationshipService.AcceptRelationshipRequest(c, claims.Id, input.Input)
		},
	)
}

func (route *RelationshipRoute) RejectRelationshipRequest(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*globals.SingleInputDTO[string], error) {
			return utils.ParseDto[globals.SingleInputDTO[string]](c)
		},
		func(input *globals.SingleInputDTO[string]) (any, error) {
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.RelationshipService.DeleteRelationshipRequestById(c, claims.Id, input.Input)
		},
	)
}

func (route *RelationshipRoute) GetSentRelationshipRequests(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*relationship.GetRelationshipRequestsForUserDto, error) {
			return utils.ParseDto[relationship.GetRelationshipRequestsForUserDto](c)
		},
		func(input *relationship.GetRelationshipRequestsForUserDto) (any, error) {
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.RelationshipService.GetSentRelationshipRequestForUser(c, claims.Id, *input)
		},
	)
}

func (route *RelationshipRoute) GetReceivedRelationshipRequests(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*relationship.GetRelationshipRequestsForUserDto, error) {
			return utils.ParseDto[relationship.GetRelationshipRequestsForUserDto](c)
		},
		func(input *relationship.GetRelationshipRequestsForUserDto) (any, error) {
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.RelationshipService.GetReceivedRelationshipRequestForUser(c, claims.Id, *input)
		},
	)
}

func (route *RelationshipRoute) GetRelationship(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			claims, err := utils.GetRelationshipFromContext(c)
			return *claims, err
		},
	)
}

func (route *RelationshipRoute) GetRelationshipPartner(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}

			relationship, err := utils.GetRelationshipFromContext(c)
			if err != nil {
				return nil, err
			}

			partnerId := lo.Ternary(relationship.Partner1 == claims.Id, relationship.Partner2, relationship.Partner2)
			return route.UserService.GetUserById(c, user.GetUserByIdArgs{
				UserId: partnerId,
			})
		},
	)
}

func (route *RelationshipRoute) LeaveRelationship(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.RelationshipService.DeleteUserRelationship(c, claims.Id)
		},
	)
}

func (route *RelationshipRoute) UpdateRelationship(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*relationship.UpdateRelationshipDto, error) {
			return utils.ParseDto[relationship.UpdateRelationshipDto](c)
		},
		func(input *relationship.UpdateRelationshipDto) (any, error) {
			relationship, err := utils.GetRelationshipFromContext(c)
			if err != nil {
				return nil, err
			}

			return route.RelationshipService.UpdateRelationship(c, relationship.Id, *input)
		},
	)
}
