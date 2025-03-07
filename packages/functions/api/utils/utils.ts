import { promises as fs } from "fs";

export const getCDNPrivateKey = async () => {
    return fs.readFile("/tmp/cdn_private_key.pem", "utf-8");
};
