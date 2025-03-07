import { trpc } from "./api";
import { contentBucket } from "./storage";

export const frontend = new sst.aws.Nextjs("Frontend", {
    path: "packages/frontend",
    dev: {
        command: "bun run dev",
    },
    openNextVersion: "3.5.1",
    link: [trpc, contentBucket],
    domain: $app.stage === "production" ? "lumi.ajani.me" : undefined,
});
