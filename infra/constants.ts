import { db } from './db';

export const accountId = db.arn.apply(arn => arn.split(':')[4]);
