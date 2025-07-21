package user

import (
	"lumi/pkg/dynamo"
	"time"
)

const EntityTypeUserRecord dynamo.EntityType = "USER"

type UserStatus string

const (
	UserStatusOnline  UserStatus = "online"
	UserStatusOffline UserStatus = "offline"
	UserStatusIdle    UserStatus = "idle"
)

type UserRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoGSI1Keys
	dynamo.DynamoGSI2Keys
	dynamo.DynamoEntityType
	Id             string     `json:"id"`
	Email          string     `json:"email"`
	Username       string     `json:"username"`
	FirstName      string     `json:"firstName"`
	LastName       string     `json:"lastName"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	AvatarKey      string     `json:"avatarKey"`
	AvatarUrl      *string    `json:"avatarUrl"`
	RelationshipId string     `json:"relationshipId"`
	Status         UserStatus `json:"status"`
}

type UpdateableUserRecord struct {
	FirstName      dynamo.UpdateableDynamoField[string]     `json:"firstName"`
	LastName       dynamo.UpdateableDynamoField[string]     `json:"lastName"`
	AvatarKey      dynamo.UpdateableDynamoField[string]     `json:"avatarKey"`
	RelationshipId dynamo.UpdateableDynamoField[string]     `json:"relationshipId"`
	Status         dynamo.UpdateableDynamoField[UserStatus] `json:"status"`
	UpdatedAt      dynamo.UpdateableDynamoField[time.Time]  `json:"updatedAt"`
}

func (u UserRecord) GetPK() string {
	return u.PK
}

func (u UserRecord) GetSK() string {
	return u.SK
}

func (u UserRecord) GetGSI1() (*string, *string) {
	return &u.GSI1PK, &u.GSI1SK
}

func (u UserRecord) GetGSI2() (*string, *string) {
	return &u.GSI2PK, &u.GSI2SK
}

type UserKeys struct{}

const UserKeyPrefix string = "user"

func (keys UserKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey(UserKeyPrefix, suffix...)
}

func (keys UserKeys) PK(userId string) string {
	return keys.BuildKey(userId)
}

func (keys UserKeys) SK(userId string) string {
	return keys.BuildKey(userId)
}

func (keys UserKeys) GSI1PK() string {
	return keys.BuildKey("username")
}

func (keys UserKeys) GSI1SK(username string) string {
	return keys.BuildKey(username)
}

func (keys UserKeys) GSI2PK() string {
	return keys.BuildKey("email")
}

func (keys UserKeys) GSI2SK(email string) string {
	return keys.BuildKey(email)
}
