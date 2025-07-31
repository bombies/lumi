package routes

import (
	"lumi/api/app/utils"
	"lumi/pkg/models/relationship"
	"lumi/pkg/models/user"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
)

type RelationshipRoute struct {
	ProtectedGroup      *gin.RouterGroup
	RelationshipRoute   gin.IRoutes
	UserService         *user.UserService
	RelationshipService *relationship.RelationshipService
}

func (route *RelationshipRoute) RegisterEndpoints() {
	protectedRouter := route.ProtectedGroup
	relationshipRouter := route.RelationshipRoute

	protectedRouter.POST(route.endpoint("/send/:id"), route.sendRelationshipRequest)
	protectedRouter.POST(route.endpoint("/accept/:id"), route.acceptRelationshipRequest)
	protectedRouter.POST(route.endpoint("/reject/:id"), route.rejectRelationshipRequest)
	protectedRouter.GET(route.endpoint("/sent"), route.getSentRelationshipRequests)
	protectedRouter.GET(route.endpoint("/received"), route.getReceivedRelationshipRequests)
	relationshipRouter.GET(route.endpoint(), route.getRelationship)
	relationshipRouter.PATCH(route.endpoint(), route.updateRelationship)
	relationshipRouter.GET(route.endpoint("/partner"), route.getRelationshipPartner)
	relationshipRouter.POST(route.endpoint("/leave"), route.leaveRelationship)
}

func (route *RelationshipRoute) endpoint(path ...string) string {
	return buildEndpointString("relationships", path...)
}

func (route *RelationshipRoute) sendRelationshipRequest(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			receiverId := c.Param("id")
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.RelationshipService.SendRelationshipRequest(c, claims.Id, receiverId)
		},
	)
}

func (route *RelationshipRoute) acceptRelationshipRequest(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			requestId := c.Param("id")
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.RelationshipService.AcceptRelationshipRequest(c, claims.Id, requestId)
		},
	)
}

func (route *RelationshipRoute) rejectRelationshipRequest(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			requestId := c.Param("id")
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.RelationshipService.DeleteRelationshipRequestById(c, claims.Id, requestId)
		},
	)
}

func (route *RelationshipRoute) getSentRelationshipRequests(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*relationship.GetRelationshipRequestsForUserDto, error) {
			return utils.ParseQueryParams[relationship.GetRelationshipRequestsForUserDto](c)
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

func (route *RelationshipRoute) getReceivedRelationshipRequests(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*relationship.GetRelationshipRequestsForUserDto, error) {
			return utils.ParseQueryParams[relationship.GetRelationshipRequestsForUserDto](c)
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

func (route *RelationshipRoute) getRelationship(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			relationship, err := utils.GetRelationshipFromContext(c)
			return *relationship, err
		},
	)
}

func (route *RelationshipRoute) getRelationshipPartner(c *gin.Context) {
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

func (route *RelationshipRoute) leaveRelationship(c *gin.Context) {
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

func (route *RelationshipRoute) updateRelationship(c *gin.Context) {
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
