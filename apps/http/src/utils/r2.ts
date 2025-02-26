import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateRandomStringWithRandomLength } from ".";

const s3Client = new S3Client({
	region: "auto",
	endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
	credentials: {
		accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
	},
});

export async function getUploadUrl(
	mimeType: string | undefined,
	canteenId: string
): Promise<{ url: string; key: string }> {
	const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

	if (!mimeType || !allowedTypes.includes(mimeType.toLowerCase())) {
		throw new Error("Invalid image type. Allowed types: JPG, PNG, WebP");
	}

	const key = `${canteenId}/menu-items/${generateRandomStringWithRandomLength(10, 15)}-${Date.now()}`;

	try {
		const command = new PutObjectCommand({
			Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
			Key: key,
			ContentType: mimeType,
		});

		const url = await getSignedUrl(s3Client, command, {
			expiresIn: 3600,
		});

		return { url, key };
	} catch (error) {
		console.error("Failed to generate signed URL:", error);
		throw new Error("Failed to generate upload URL");
	}
}
