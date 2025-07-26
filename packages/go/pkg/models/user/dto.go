package user

import (
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/dlclark/regexp2"
	"github.com/go-playground/validator/v10"
)

const (
	usernameRegexString  = `^[a-z][a-z0-9_]{2,31}`
	passwordRegexString  = `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[\s\S]{8,255}$`
	firstNameRegexString = `^\p{L}[\p{L}\p{M}'-]{0,49}$`
	lastNameRegexString  = `^\p{L}[\p{L}\p{M}.'\-\s]{0,79}$`
)

var (
	UsernameRegex  = regexp2.MustCompile(usernameRegexString, regexp2.None)
	PasswordRegex  = regexp2.MustCompile(passwordRegexString, regexp2.None)
	FirstNameRegex = regexp2.MustCompile(firstNameRegexString, regexp2.Unicode)
	LastNameRegex  = regexp2.MustCompile(lastNameRegexString, regexp2.Unicode)
)

type CreateUserDto struct {
	Id        *string `json:"id,omitempty"`
	Email     string  `json:"email" binding:"required,email"`
	Username  string  `json:"username" binding:"required,username"`
	FirstName string  `json:"firstName" binding:"required,firstname"`
	LastName  string  `json:"lastName" binding:"required,lastname"`
}

type UpdateUserDto struct {
	FirstName      *string     `json:"firstName,omitempty" binding:"firstname"`
	LastName       *string     `json:"lastName,omitempty" binding:"lastname"`
	Verified       *bool       `json:"verified,omitempty"`
	AvatarKey      *string     `json:"avatarKey,omitempty"`
	RelationshipId *string     `json:"relationshipId,omitempty"`
	Status         *UserStatus `json:"status,omitempty" binding:"oneof=online offline idle"`
}

type GetUsersByUsernameDto struct {
	Limit       int                             `json:"limit" form:"limit" binding:"min=1,max=100"`
	Cursor      map[string]types.AttributeValue `json:"cursor" form:"cursor"`
	Username    string                          `json:"username" form:"username" binding:"required"`
	Projections []string                        `json:"projections" form:"projections" binding:"dive,oneof=id email username firstName lastName avatarKey relationshipId status"`
}

func (dto *GetUsersByUsernameDto) GetLimit() int {
	return dto.Limit
}

func (dto *GetUsersByUsernameDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

type GetUsersByEmailDto struct {
	Limit       int                             `json:"limit" form:"limit" binding:"min=1,max=100"`
	Cursor      map[string]types.AttributeValue `json:"cursor" form:"cursor"`
	Email       string                          `json:"email" form:"email" binding:"required,email"`
	Projections []string                        `json:"projections" form:"projections" binding:"dive,oneof=id email username firstName lastName avatarKey relationshipId status"`
}

func (dto *GetUsersByEmailDto) GetLimit() int {
	return dto.Limit
}

func (dto *GetUsersByEmailDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

func ValidateUsername(fl validator.FieldLevel) bool {
	res, err := UsernameRegex.MatchString(fl.Field().String())
	if err != nil {
		panic(err)
	}

	return res
}

func ValidatePassword(fl validator.FieldLevel) bool {
	res, err := PasswordRegex.MatchString(fl.Field().String())
	if err != nil {
		panic(err)
	}

	return res
}

func ValidateFirstName(fl validator.FieldLevel) bool {
	res, err := FirstNameRegex.MatchString(fl.Field().String())
	if err != nil {
		panic(err)
	}

	return res
}

func ValidateLastName(fl validator.FieldLevel) bool {
	res, err := LastNameRegex.MatchString(fl.Field().String())
	if err != nil {
		panic(err)
	}

	return res
}

func RegisterUserValidators(validator *validator.Validate) error {
	err := validator.RegisterValidation("username", ValidateUsername)
	if err != nil {
		return err
	}

	err = validator.RegisterValidation("password", ValidatePassword)
	if err != nil {
		return err
	}

	err = validator.RegisterValidation("firstname", ValidateFirstName)
	if err != nil {
		return err
	}

	err = validator.RegisterValidation("lastname", ValidateLastName)
	if err != nil {
		return err
	}

	return nil
}
