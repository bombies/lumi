package models

type GetUploadUrlDto struct {
	ObjectKey     string `json:"objectKey" form:"objectKey"`
	FileExtension string `json:"fileExtension" form:"fileExtension"`
}
