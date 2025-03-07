import { db } from "./db";
import { contentBucket } from "./storage";

export const trpc = new sst.aws.Function("Trpc", {
    url: true,
    link: [contentBucket, db],
    copyFiles: [
        { from: "cdn-keys/private_key.pem", to: "/tmp/cdn_private_key.pem" },
    ],
    handler: "packages/functions/api/index.handler",
});
