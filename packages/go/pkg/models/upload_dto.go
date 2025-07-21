package models

type GetUploadUrlDto struct {
	ObjectKey     string `json:"objectKey"`
	FileExtension string `json:"fileExtension"`
}
