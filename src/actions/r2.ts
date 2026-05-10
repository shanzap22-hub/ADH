"use server";

import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2";

/**
 * Uploads a file to Cloudflare R2 bucket.
 * @param formData The form data containing the file
 * @param folder The folder path within the bucket
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(formData: FormData, folder: string): Promise<{ url?: string; error?: string }> {
    const file = formData.get("file") as File;
    if (!file) return { error: "No file uploaded" };

    if (!R2_BUCKET_NAME || !s3Client) {
        return { error: "R2 storage configuration missing." };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Sanitize filename
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${Date.now()}-${sanitizedName}`;
        const uploadPath = folder ? `${folder}/${fileName}` : fileName;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: uploadPath,
            Body: buffer,
            ContentType: file.type || "application/octet-stream",
        });

        await s3Client.send(command);

        // Return the custom domain URL
        return { url: `${R2_PUBLIC_URL}/${uploadPath}` };

    } catch (error: any) {
        console.error("R2 Upload Exception:", error);
        return { error: "R2 Upload failed: " + error.message };
    }
}

/**
 * Deletes a file from Cloudflare R2 bucket.
 * @param fileUrl The full URL of the file to delete
 */
export async function deleteFromR2(fileUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Extract the key from the URL
        const key = fileUrl.replace(`${R2_PUBLIC_URL}/`, "");
        
        const command = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(command);
        return { success: true };
    } catch (error: any) {
        console.error("R2 Delete Exception:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate a pre-signed URL for client-side uploads to R2.
 */
export async function getPresignedUrl(fileName: string, contentType: string, folder: string) {
    try {
        const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `${folder}/${Date.now()}-${sanitizedName}`;
        
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        // URL expires in 1 hour
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        const publicUrl = `${R2_PUBLIC_URL}/${key}`;

        return { signedUrl, publicUrl, key };
    } catch (error: any) {
        console.error("Presigned URL Error:", error);
        return { error: error.message };
    }
}
