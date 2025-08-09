package routes

import (
	"lumi/api/app/utils"
	"lumi/pkg/models"
	"lumi/pkg/models/relationship"
	songrecommendation "lumi/pkg/models/song-recommendation"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SongRecommendationRoute struct {
	RelationshipRoute gin.IRoutes
	SongRecService    *songrecommendation.SongRecommendationService
}

func (route *SongRecommendationRoute) RegisterEndpoints() {
	router := route.RelationshipRoute

	router.POST(route.endpoint(), route.createSongRecommendation)
	router.GET(route.endpoint(), route.getSongRecommendations)
	router.GET(route.endpoint("/self"), route.getSelfSongRecommendations)
	router.GET(route.endpoint("/relationship"), route.getSongRecommendationsForRelationship)
	router.PATCH(route.endpoint("/:id"), route.updateSongRecommendation)
	router.DELETE(route.endpoint("/:id"), route.deleteSongRecommendation)
}

func (route *SongRecommendationRoute) endpoint(path ...string) string {
	return buildEndpointString("music", path...)
}

func (route *SongRecommendationRoute) createSongRecommendation(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*songrecommendation.CreateSongRecommendationDto, error) {
			return utils.ParseDto[songrecommendation.CreateSongRecommendationDto](c)
		},
		func(input *songrecommendation.CreateSongRecommendationDto) (any, error) {
			claims, relationship, err := utils.GetContextObjects(c)
			if err != nil {
				return nil, err
			}
			return route.SongRecService.CreateSongRecommendation(c, claims.Id, relationship.Id, *input)
		},
	)
}

func (route *SongRecommendationRoute) getSongRecommendations(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*songrecommendation.GetSongRecommendationsDto, error) {
			return utils.ParseQueryParams[songrecommendation.GetSongRecommendationsDto](c)
		},
		func(input *songrecommendation.GetSongRecommendationsDto) (any, error) {
			claims, rship, err := utils.GetContextObjects(c)
			if err != nil {
				return nil, err
			}
			return route.SongRecService.GetSongRecommendations(
				c,
				relationship.ExtractPartnerIdFromRelationship(claims.Id, *rship),
				rship.Id,
				*input,
			)
		},
	)
}

func (route *SongRecommendationRoute) getSelfSongRecommendations(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*songrecommendation.GetSongRecommendationsDto, error) {
			return utils.ParseQueryParams[songrecommendation.GetSongRecommendationsDto](c)
		},
		func(input *songrecommendation.GetSongRecommendationsDto) (any, error) {
			claims, rship, err := utils.GetContextObjects(c)
			if err != nil {
				return nil, err
			}
			return route.SongRecService.GetSongRecommendations(
				c,
				claims.Id,
				rship.Id,
				*input,
			)
		},
	)
}

func (route *SongRecommendationRoute) getSongRecommendationsForRelationship(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*songrecommendation.GetSongRecommendationsDto, error) {
			return utils.ParseQueryParams[songrecommendation.GetSongRecommendationsDto](c)
		},
		func(input *songrecommendation.GetSongRecommendationsDto) (any, error) {
			rship, err := utils.GetRelationshipFromContext(c)
			if err != nil {
				return nil, err
			}
			return route.SongRecService.GetSongRecommendationsByRelationshipId(
				c,
				rship.Id,
				*input,
			)
		},
	)
}

func (route *SongRecommendationRoute) updateSongRecommendation(c *gin.Context) {
	utils.HandleResponse(
		c,
		func() (*songrecommendation.UpdateSongRecommendationDto, error) {
			return utils.ParseDto[songrecommendation.UpdateSongRecommendationDto](c)
		},
		func(input *songrecommendation.UpdateSongRecommendationDto) (any, error) {
			recId := c.Param("id")

			claims, rship, err := utils.GetContextObjects(c)
			if err != nil {
				return nil, err
			}

			rec, err := route.SongRecService.GetSongRecommendationById(c, recId)

			if err != nil {
				return nil, err
			}

			if rec == nil {
				return nil, &models.ServiceError{
					StatusCode: http.StatusNotFound,
					Message:    "There is no song recommendation with that ID!",
				}
			}

			if rec.RelationshipId != rship.Id || claims.Id == rec.RecommenderId {
				return nil, &models.ServiceError{
					StatusCode: http.StatusForbidden,
					Message:    "You cannot update this song recommendation!",
				}
			}

			return route.SongRecService.UpdateSongRecommendation(c, recId, *input)
		},
	)
}

func (route *SongRecommendationRoute) deleteSongRecommendation(c *gin.Context) {
	utils.HandleResponse(
		c,
		nil,
		func(input *any) (any, error) {
			recId := c.Param("id")

			claims, rship, err := utils.GetContextObjects(c)
			if err != nil {
				return nil, err
			}

			rec, err := route.SongRecService.GetSongRecommendationById(c, recId)

			if err != nil {
				return nil, err
			}

			if rec == nil {
				return nil, &models.ServiceError{
					StatusCode: http.StatusNotFound,
					Message:    "There is no song recommendation with that ID!",
				}
			}

			if rec.RelationshipId != rship.Id || claims.Id != rec.RecommenderId {
				return nil, &models.ServiceError{
					StatusCode: http.StatusForbidden,
					Message:    "You cannot delete this song recommendation!",
				}
			}

			return route.SongRecService.DeleteSongRecommendation(c, recId)
		},
	)
}
