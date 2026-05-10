import { S3Client } from "@aws-sdk/client-s3";

if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ENDPOINT) {
    console.warn("R2 storage credentials missing from environment variables.");
}

// Clean the endpoint to remove the bucket name if it's there
// Standard R2 endpoint format is https://<accountid>.r2.cloudflarestorage.com
const endpoint = process.env.R2_ENDPOINT?.replace(/\/adh-lms-storage$/, "");

export const s3Client = new S3Client({
    region: "auto",
    endpoint: endpoint,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.startsWith("http") 
    ? process.env.R2_PUBLIC_URL 
    : `https://${process.env.R2_PUBLIC_URL}`;
