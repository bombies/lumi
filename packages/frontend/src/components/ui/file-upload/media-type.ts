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
	MOV = 'video/quicktime',
	AVI = 'video/x-msvideo',
	WMV = 'video/x-ms-wmv',
}

export const DefaultImageMediaTypes = [MediaType.JPEG, MediaType.PNG];
export const DefaultVideoMediaTypes = [
	MediaType.MP4,
	MediaType.MPEG,
	MediaType.OGG,
	MediaType.WEBM,
	MediaType.WMV,
	MediaType.AVI,
	MediaType.MOV,
];
export const DefaultAudioMediaTypes = [MediaType.AAC, MediaType.MP3, MediaType.WAV, MediaType.WEBA];

export default MediaType;
