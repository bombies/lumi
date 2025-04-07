import * as fs from 'fs';

export const authSecret = new sst.Secret('AuthSecret');

export const postgresHost = new sst.Secret('PostgresHost');
export const postgresDatabase = new sst.Secret('PostgresDatabase');
export const postgresUsername = new sst.Secret('PostgresUsername');
export const postgresPassword = new sst.Secret('PostgresPassword');
export const postgresPort = new sst.Secret('PostgresPort');
export const postgresConnectionString = new sst.Secret('PostgresConnectionString');

export const mailerHostSecret = new sst.Secret('MailerHost');
export const mailerPortSecret = new sst.Secret('MailerPort');
export const mailerUserSecret = new sst.Secret('MailerUser');
export const mailerPasswordSecret = new sst.Secret('MailerPassword');

export const redisUser = new sst.Secret('RedisUser');
export const redisHost = new sst.Secret('RedisHost');
export const redisPort = new sst.Secret('RedisPort');
export const redisPassword = new sst.Secret('RedisPassword');

export const vapidPublicKey = new sst.Secret('VapidPublicKey');
export const vapidPrivateKey = new sst.Secret('VapidPrivateKey');

export const websocketToken = new sst.Secret('WebSocketToken');

export let cdnPrivateKey = fs.readFileSync(`${process.cwd()}/cdn-keys/${$app.stage}.private_key.pem`, 'utf8');

export const spotifyClientId = new sst.Secret('SpotifyClientId');
export const spotifyClientSecret = new sst.Secret('SpotifyClientSecret');

export const sentryAuthToken = new sst.Secret('SentryAuthToken');

export const contentCdnPublicKeyId = new sst.Secret('ContentCdnPublicKeyId');
export const contentCdnKeyGroupId = new sst.Secret('ContentCdnKeyGroupId');
export const frontendCdnCachePolicyId = new sst.Secret('FrontendCdnCachePolicyId');
