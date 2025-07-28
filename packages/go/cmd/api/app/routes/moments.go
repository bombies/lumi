package routes

import (
	"lumi/api/app/utils"
	"lumi/pkg/models"
	"lumi/pkg/models/moment"
	relationships "lumi/pkg/models/relationship"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
)

type MomentRoute struct {
	RelationshipRoute gin.IRoutes
	MomentService     *moment.MomentService
}

func (route *MomentRoute) RegisterEndpoints() {
	relationshipRoute := route.RelationshipRoute

	relationshipRoute.POST(route.endpoint(), route.createMomentDetails)
	relationshipRoute.GET(route.endpoint("/:id"), route.getMomentDetails)
	relationshipRoute.PATCH(route.endpoint("/:id"), route.updateMomentDetails)
	relationshipRoute.DELETE(route.endpoint("/:id"), route.deleteMomentDetails)
	relationshipRoute.GET(route.endpoint(), route.getMoments)
	relationshipRoute.GET(route.endpoint("/search"), route.searchMoments)
	relationshipRoute.POST(route.endpoint("/:id/messages"), route.createMomentMessage)
	relationshipRoute.GET(route.endpoint("/:id/messages"), route.getMessagesForMoment)
	relationshipRoute.PATCH(route.endpoint("/:id/messages/:mid"), route.editMomentMessage)
	relationshipRoute.DELETE(route.endpoint("/:id/messages/:mid"), route.deleteMomentMessage)
	relationshipRoute.PUT(route.endpoint("/:id/messages/:mid/react"), route.reactToMessage)
	relationshipRoute.GET(route.endpoint("/tags"), route.getRelationshipMomentTags)
	relationshipRoute.POST(route.endpoint("/tags"), route.createRelationshipMomentTag)
	relationshipRoute.DELETE(route.endpoint("/tags/:tag"), route.deleteRelationshipMomentTag)
	relationshipRoute.GET(route.endpoint("/:id/tags"), route.getTagsForMoment)
	relationshipRoute.POST(route.endpoint("/:id/tags"), route.createTagForMoment)
	relationshipRoute.DELETE(route.endpoint("/:id/tags/:tag"), route.deleteTagForMoment)
	relationshipRoute.GET(route.endpoint("upload-url"), route.getMomentUploadUrl)
}

func (route *MomentRoute) endpoint(path ...string) string {
	return buildEndpointString("moments", path...)
}

func (route *MomentRoute) createMomentDetails(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*moment.CreateMomentDetailsDto, error) {
			return utils.ParseDto[moment.CreateMomentDetailsDto](c)
		},
		func(input *moment.CreateMomentDetailsDto) (any, error) {
			claims, relationship, err := utils.GetContextObjects(c)
			if err != nil {
				return nil, err
			}
			return route.MomentService.CreateMomentDetails(c, claims.Id, relationship.Id, *input)
		},
	)
}

func (route *MomentRoute) getMomentDetails(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			relationship, err := utils.GetRelationshipFromContext(c)
			if err != nil {
				return nil, err
			}

			momentId := c.Param("id")
			moment, err := route.MomentService.GetMomentDetailsById(c, momentId)

			if err != nil {
				return nil, err
			}

			if moment == nil || moment.RelationshipId != relationship.Id {
				return nil, &models.ServiceError{
					StatusCode: http.StatusForbidden,
					Message:    "You cannot access the details for this moment!",
				}
			}

			return moment, nil
		},
	)
}

func (route *MomentRoute) getMoments(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*moment.GetInfiniteMomentsDto, error) {
			return utils.ParseDto[moment.GetInfiniteMomentsDto](c)
		},
		func(input *moment.GetInfiniteMomentsDto) (any, error) {
			claims, relationship, err := utils.GetContextObjects(c)
			if err != nil {
				return nil, err
			}

			userId := c.Query("user")
			tag := c.Query("tag")

			if userId != "" {
				partnerId := relationships.ExtractPartnerIdFromRelationship(claims.Id, *relationship)

				if userId != partnerId && userId != claims.Id {
					return nil, &models.ServiceError{
						StatusCode: http.StatusForbidden,
						Message:    "You cannot access the moments for this user!",
					}
				}

				return route.MomentService.GetMomentsForUser(c, userId, *input)
			} else if tag != "" {
				return route.MomentService.GetMomentsByTag(c, tag, moment.GetMomentsByTagDto{
					TagQuery: tag,
					Limit:    input.Limit,
					Cursor:   input.Cursor,
					Order:    input.Order,
				})
			} else {
				return route.MomentService.GetMomentsForRelationship(c, relationship.Id, *input)

			}
		},
	)
}

func (route *MomentRoute) searchMoments(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*moment.SearchMomentsDto, error) {
			return utils.ParseQueryParams[moment.SearchMomentsDto](c)
		},
		func(input *moment.SearchMomentsDto) (any, error) {
			relationship, err := utils.GetRelationshipFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.MomentService.SearchMoments(c, relationship.Id, *input)
		},
	)
}

func (route *MomentRoute) updateMomentDetails(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*moment.UpdateMomentDetailsDto, error) {
			return utils.ParseDto[moment.UpdateMomentDetailsDto](c)
		},
		func(input *moment.UpdateMomentDetailsDto) (any, error) {
			claims, relationship, err := utils.GetContextObjects(c)

			if err != nil {
				return nil, err
			}

			momentId := c.Param("id")
			moment, err := route.MomentService.GetMomentDetailsById(c, momentId, moment.GetMomentDetailsByIdOptions{
				NilError: lo.ToPtr(true),
			})

			if err != nil {
				return nil, err
			}

			if moment.RelationshipId != relationship.Id || moment.UserId != claims.Id {
				return nil, &models.ServiceError{
					StatusCode: http.StatusForbidden,
					Message:    "You cannot update this moment!",
				}
			}

			return route.MomentService.UpdateMomentDetails(c, momentId, *input)
		},
	)
}

func (route *MomentRoute) deleteMomentDetails(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			claims, relationship, err := utils.GetContextObjects(c)
			if err != nil {
				return nil, err
			}

			momentId := c.Param("id")
			moment, err := route.MomentService.GetMomentDetailsById(c, momentId, moment.GetMomentDetailsByIdOptions{
				NilError: lo.ToPtr(true),
			})

			if err != nil {
				return nil, err
			}

			if moment.RelationshipId != relationship.Id || moment.UserId != claims.Id {
				return nil, &models.ServiceError{
					StatusCode: http.StatusForbidden,
					Message:    "You cannot delete this moment!",
				}
			}

			return route.MomentService.DeleteMomentDetails(c, momentId)
		},
	)
}

func (route *MomentRoute) createMomentMessage(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*moment.CreateMomentMessageDto, error) {
			return utils.ParseDto[moment.CreateMomentMessageDto](c)
		},
		func(input *moment.CreateMomentMessageDto) (any, error) {
			claims, relationship, err := utils.GetContextObjects(c)
			if err != nil {
				return nil, err
			}

			momentId := c.Param("id")
			moment, err := route.MomentService.GetMomentDetailsById(c, momentId, moment.GetMomentDetailsByIdOptions{
				NilError: lo.ToPtr(true),
			})

			if err != nil {
				return nil, err
			}

			if moment.RelationshipId != relationship.Id {
				return nil, &models.ServiceError{
					StatusCode: http.StatusForbidden,
					Message:    "You cannot create a message for this moment!",
				}
			}

			return route.MomentService.CreateMomentMessage(c, claims.Id, moment.Id, *input)
		},
	)
}

func (route *MomentRoute) getMessagesForMoment(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*moment.GetInfiniteMomentMessagesDto, error) {
			return utils.ParseQueryParams[moment.GetInfiniteMomentMessagesDto](c)
		},
		func(input *moment.GetInfiniteMomentMessagesDto) (any, error) {
			relationship, err := utils.GetRelationshipFromContext(c)

			if err != nil {
				return nil, err
			}

			momentId := c.Param("id")
			moment, err := route.MomentService.GetMomentDetailsById(
				c,
				momentId,
			)

			if moment == nil || moment.RelationshipId != relationship.Id {
				return nil, &models.ServiceError{
					StatusCode: http.StatusForbidden,
					Message:    "You cannot access the messages for this moment!",
				}
			}

			return route.MomentService.GetMessagesForMoment(c, momentId, *input)
		},
	)
}

func (route *MomentRoute) reactToMessage(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*moment.ReactToMessageDto, error) {
			return utils.ParseDto[moment.ReactToMessageDto](c)
		},
		func(input *moment.ReactToMessageDto) (any, error) {
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}

			momentId, messageId := c.Param("id"), c.Param("mid")

			message, err := route.MomentService.GetMomentMessageById(c, momentId)
			if err != nil {
				return nil, err
			}

			if message == nil || message.SenderId != claims.Id {
				return nil, &models.ServiceError{
					StatusCode: http.StatusForbidden,
					Message:    "You cannot react to this message!",
				}
			}

			return route.MomentService.UpdateMomentMessage(c, messageId, moment.UpdateMomentMessageDto{
				Reaction: &input.Reaction,
			})
		},
	)
}

func (route *MomentRoute) editMomentMessage(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*moment.UpdateMomentMessageDto, error) {
			return utils.ParseDto[moment.UpdateMomentMessageDto](c)
		},
		func(input *moment.UpdateMomentMessageDto) (any, error) {
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}

			momentId, messageId := c.Param("id"), c.Param("mid")

			message, err := route.MomentService.GetMomentMessageById(c, momentId)
			if err != nil {
				return nil, err
			}

			if message == nil || message.SenderId != claims.Id {
				return nil, &models.ServiceError{
					StatusCode: http.StatusForbidden,
					Message:    "You cannot edit this message!",
				}
			}

			return route.MomentService.UpdateMomentMessage(c, messageId, *input)
		},
	)
}

func (route *MomentRoute) deleteMomentMessage(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			claims, err := utils.GetUserFromContext(c)
			if err != nil {
				return nil, err
			}

			messageId := c.Param("mid")
			message, err := route.MomentService.GetMomentMessageById(c, messageId)

			if err != nil {
				return nil, err
			}

			if message == nil || message.SenderId != claims.Id {
				return nil, &models.ServiceError{
					StatusCode: http.StatusUnauthorized,
					Message:    "You cannot delete this message!",
				}
			}

			return route.MomentService.DeleteMomentMessage(c, messageId)
		},
	)
}

func (route *MomentRoute) getRelationshipMomentTags(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*moment.GetRelationshipMomentTagsDto, error) {
			return utils.ParseQueryParams[moment.GetRelationshipMomentTagsDto](c)
		},
		func(input *moment.GetRelationshipMomentTagsDto) (any, error) {
			relationship, err := utils.GetRelationshipFromContext(c)

			if err != nil {
				return err, nil
			}

			return route.MomentService.GetRelationshipMomentTags(c, relationship.Id, *input)
		},
	)
}

func (route *MomentRoute) createRelationshipMomentTag(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*moment.CreateRelationshipMomentTagDto, error) {
			return utils.ParseDto[moment.CreateRelationshipMomentTagDto](c)
		},
		func(input *moment.CreateRelationshipMomentTagDto) (any, error) {
			relationship, err := utils.GetRelationshipFromContext(c)

			if err != nil {
				return err, nil
			}

			return route.MomentService.CreateRelationshipMomentTag(c, relationship.Id, *input)
		},
	)
}

func (route *MomentRoute) deleteRelationshipMomentTag(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			relationship, err := utils.GetRelationshipFromContext(c)

			if err != nil {
				return err, nil
			}

			tag := c.Param("tag")
			momentTag, err := route.MomentService.GetRelationshipMomentTag(c, relationship.Id, tag)

			if err != nil {
				return nil, err
			}

			if momentTag == nil || momentTag.RelationshipId != relationship.Id {
				return nil, &models.ServiceError{
					StatusCode: http.StatusForbidden,
					Message:    "You cannot delete this moment tag!",
				}
			}

			return route.MomentService.DeleteRelationshipMomentTag(c, relationship.Id, tag)
		},
	)
}

func (route *MomentRoute) getTagsForMoment(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			relationship, err := utils.GetRelationshipFromContext(c)

			if err != nil {
				return err, nil
			}

			momentId := c.Param("id")
			moment, err := route.MomentService.GetMomentDetailsById(c, momentId)

			if err != nil {
				return nil, err
			}

			if moment == nil || moment.RelationshipId != relationship.Id {
				return nil, &models.ServiceError{
					StatusCode: http.StatusForbidden,
					Message:    "You cannot access the tags for this moment!",
				}
			}

			return route.MomentService.GetTagsForMoment(c, momentId)
		},
	)
}

func (route *MomentRoute) createTagForMoment(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*moment.CreateMomentTagDto, error) {
			return utils.ParseDto[moment.CreateMomentTagDto](c)
		},
		func(input *moment.CreateMomentTagDto) (any, error) {
			claims, relationship, err := utils.GetContextObjects(c)

			if err != nil {
				return nil, err
			}

			momentId := c.Param("id")
			moment, err := route.MomentService.GetMomentDetailsById(c, momentId)

			if err != nil {
				return nil, err
			}

			if moment == nil || moment.RelationshipId != relationship.Id || moment.UserId != claims.Id {
				return nil, &models.ServiceError{
					StatusCode: http.StatusForbidden,
					Message:    "You cannot create a tag for this moment!",
				}
			}

			return route.MomentService.CreateMomentTag(c, claims.Id, relationship.Id, momentId, *input)
		},
	)
}

func (route *MomentRoute) deleteTagForMoment(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			relationship, err := utils.GetRelationshipFromContext(c)

			if err != nil {
				return err, nil
			}

			momentId, tag := c.Param("id"), c.Param("tag")
			momentTag, err := route.MomentService.GetTagForMoment(c, momentId, tag)

			if err != nil {
				return nil, err
			}

			if momentTag == nil || momentTag.RelationshipId != relationship.Id {
				return nil, &models.ServiceError{
					StatusCode: http.StatusForbidden,
					Message:    "You cannot delete this tag for this moment!",
				}
			}

			return route.MomentService.DeleteMomentTag(c, moment.DeleteMomentTagDto{
				MomentId: momentId,
				Tag:      tag,
			})
		},
	)
}

func (route *MomentRoute) getMomentUploadUrl(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*models.GetUploadUrlDto, error) {
			return utils.ParseQueryParams[models.GetUploadUrlDto](c)
		},
		func(input *models.GetUploadUrlDto) (any, error) {
			relationship, err := utils.GetRelationshipFromContext(c)

			if err != nil {
				return nil, err
			}

			return route.MomentService.GetMomentUploadUrl(c, relationship.Id, *input)
		},
	)
}
