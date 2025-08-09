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
	Id             string     `json:"id,omitempty"`
	Email          string     `json:"email,omitempty"`
	Username       string     `json:"username,omitempty"`
	FirstName      string     `json:"firstName,omitempty"`
	LastName       string     `json:"lastName,omitempty"`
	CreatedAt      time.Time  `json:"createdAt,omitempty"`
	UpdatedAt      time.Time  `json:"updatedAt,omitempty"`
	AvatarKey      string     `json:"avatarKey,omitempty"`
	AvatarUrl      *string    `json:"avatarUrl,omitempty"`
	RelationshipId string     `json:"relationshipId,omitempty"`
	Status         UserStatus `json:"status,omitempty"`
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

type UpdateableUserRecord struct {
	FirstName      dynamo.UpdateableDynamoField[string]     `json:"firstName"`
	LastName       dynamo.UpdateableDynamoField[string]     `json:"lastName"`
	AvatarKey      dynamo.UpdateableDynamoField[string]     `json:"avatarKey"`
	RelationshipId dynamo.UpdateableDynamoField[string]     `json:"relationshipId"`
	Status         dynamo.UpdateableDynamoField[UserStatus] `json:"status"`
	UpdatedAt      dynamo.UpdateableDynamoField[time.Time]  `json:"updatedAt"`
}

func (u UpdateableUserRecord) GetUpdateTag() string {
	return "updateable-user-record"
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
