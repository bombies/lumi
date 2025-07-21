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
	Id        *string `json:"id"`
	Email     string  `json:"email" validate:"required,email"`
	Username  string  `json:"username" validate:"required,username"`
	FirstName string  `json:"firstName" validate:"required,firstname"`
	LastName  string  `json:"lastName" validate:"required,lastname"`
}

type UpdateUserDto struct {
	FirstName      *string     `json:"firstName" validate:"firstname"`
	LastName       *string     `json:"lastName" validate:"lastname"`
	Verified       *bool       `json:"verified"`
	AvatarKey      *string     `json:"avatarKey"`
	RelationshipId *string     `json:"relationshipId"`
	Status         *UserStatus `json:"status" validate:"oneof=online offline idle"`
}

type GetUsersByUsernameDto struct {
	Limit       int                             `json:"limit" validate:"min=1,max=100"`
	Cursor      map[string]types.AttributeValue `json:"cursor"`
	Username    string                          `json:"username" validate:"required"`
	Projections []string                        `json:"projections" validate:"dive,oneof=id email username firstName lastName avatarKey relationshipId status"`
}

func (dto *GetUsersByUsernameDto) GetLimit() int {
	return dto.Limit
}

func (dto *GetUsersByUsernameDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

type GetUsersByEmailDto struct {
	Limit       int                             `json:"limit" validate:"min=1,max=100"`
	Cursor      map[string]types.AttributeValue `json:"cursor"`
	Email       string                          `json:"email" validate:"required,email"`
	Projections []string                        `json:"projections" validate:"dive,oneof=id email username firstName lastName avatarKey relationshipId status"`
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
