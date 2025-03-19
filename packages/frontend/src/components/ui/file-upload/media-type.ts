enum MediaType {
	JSON = 'application/json',
	IMAGE = 'image/*',
	VIDEO = 'video/*',
	AUDIO = 'audio.*',
	AAC = 'audio/aac',
	MP3 = 'audio/mp3',
	AVIF = 'image/avif',
	BMP = 'image/bmp',
	JPEG = 'image/jpeg',
	PNG = 'image/png',
	WEBP = 'image/webp',
	MP4 = 'video/mp4',
	MPEG = 'video/mpeg',
	OGG = 'video/ogg',
	WEBM = 'video/webm',
	WAV = 'audio/wav',
	WEBA = 'audio/weba',
}

export const DefaultImageMediaTypes = [MediaType.JPEG, MediaType.PNG];

export default MediaType;
