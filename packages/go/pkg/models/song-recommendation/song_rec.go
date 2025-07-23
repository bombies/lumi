package songrecommendation

import (
	"lumi/pkg/dynamo"
	"time"

	"github.com/samber/lo"
)

const EntityTypeSongRecommendation dynamo.EntityType = "SONG_RECOMMENDATION"

type RecommendedSpotifyTrack struct {
	Id         string  `json:"id"`
	Uri        string  `json:"uri"`
	Name       string  `json:"name"`
	ArtistName string  `json:"artistName"`
	AlbumImage *string `json:"albumImage,omitempty"`
	Duration   int     `json:"duration"`
}

type SongRecommendationRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoGSI1Keys
	dynamo.DynamoGSI2Keys
	dynamo.OptionalDynamoGSI3Keys
	dynamo.DynamoEntityType
	Id             string                  `json:"id"`
	Listened       bool                    `json:"listened"`
	Rating         *float32                `json:"rating,omitempty"`
	Comments       *string                 `json:"comments,omitempty"`
	RecommenderId  string                  `json:"recommenderId"`
	RelationshipId string                  `json:"relationshipId"`
	CreatedAt      time.Time               `json:"createdAt"`
	UpdatedAt      time.Time               `json:"updatedAt"`
	Track          RecommendedSpotifyTrack `json:"track"`
}

func (sr SongRecommendationRecord) GetPK() string {
	return sr.PK
}

func (sr SongRecommendationRecord) GetSK() string {
	return sr.SK
}

func (sr SongRecommendationRecord) GetGSI1() (*string, *string) {
	return &sr.GSI1PK, &sr.GSI1SK
}

func (sr SongRecommendationRecord) GetGSI2() (*string, *string) {
	return &sr.GSI2PK, &sr.GSI2SK
}

func (sr SongRecommendationRecord) GetGSI3() (*string, *string) {
	return sr.GSI3PK, sr.GSI3SK
}

type UpdateableSongRecommendation struct {
	dynamo.UpdateableGlobalIndex1Keys
	dynamo.UpdateableGlobalIndex3Keys
	Listened  *dynamo.UpdateableDynamoField[bool]      `json:"listened"`
	Rating    *dynamo.UpdateableDynamoField[float32]   `json:"rating,omitempty"`
	Comments  *dynamo.UpdateableDynamoField[string]    `json:"comments,omitempty"`
	UpdatedAt *dynamo.UpdateableDynamoField[time.Time] `json:"updatedAt"`
}

func (sr UpdateableSongRecommendation) GetUpdateTag() string {
	return "updateable-song-recommendation"
}

type SongRecommendationKeys struct{}

func (keys SongRecommendationKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey("songrec#", suffix...)
}

func (keys SongRecommendationKeys) PK(recommendationId string) string {
	return keys.BuildKey(recommendationId)
}

func (keys SongRecommendationKeys) SK(recommendationId string) string {
	return keys.BuildKey(recommendationId)
}

func (keys SongRecommendationKeys) GSI1PK(relationshipId string) string {
	return keys.BuildKey(relationshipId)
}

func (keys SongRecommendationKeys) GSI1SK(recommenderId string, listened bool, createdAt time.Time) string {
	return keys.BuildKey(
		recommenderId,
		lo.Ternary(listened, "listened", "unlistened"),
		createdAt.Format(time.RFC3339),
	)
}

func (keys SongRecommendationKeys) GSI2PK(recommenderId string) string {
	return keys.BuildKey(recommenderId)
}

func (keys SongRecommendationKeys) GSI2SK(trackId string) string {
	return keys.BuildKey(trackId)
}

func (keys SongRecommendationKeys) GSI3PK(relationshipId string) string {
	return keys.BuildKey(relationshipId)
}

func (keys SongRecommendationKeys) GSI3SK(relationshipId string, updateTimestamp time.Time) string {
	return keys.BuildKey(relationshipId, updateTimestamp.Format(time.RFC3339))
}
