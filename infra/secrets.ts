export const authSecret = new sst.Secret('AuthSecret');

export const mailerHostSecret = new sst.Secret('MailerHost');
export const mailerPortSecret = new sst.Secret('MailerPort');
export const mailerUserSecret = new sst.Secret('MailerUser');
export const mailerPasswordSecret = new sst.Secret('MailerPassword');

export const redisUser = new sst.Secret('RedisUser');
export const redisHost = new sst.Secret('RedisHost');
export const redisPort = new sst.Secret('RedisPort');
export const redisPassword = new sst.Secret('RedisPassword');
