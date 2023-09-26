import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { UploadApiResponse } from "cloudinary";

export function getUserFromAuthorizationHeader(authHeader: string | null) {
  if (!authHeader) {
    return;
  }
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return;
  }
  let user = undefined;
  try {
    user = jwt.verify(token, "TOKEN");
  } catch (err) {
    console.log(`Error while verifying jwt, err: ${err}`);
  }
  return user;
}

export async function deleteFromCloud(publicID: string) {
  cloudinary.uploader.destroy(publicID, (error, result) => {
    if (error) {
      console.log(error);
      return;
    }
    console.log(result);
  });
}

export async function uploadFromBuffer(
  file: File,
  publicID?: string,
): Promise<UploadApiResponse> {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    let cld_upload_stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        allowed_formats: ["jpg", "png"],
        public_id: publicID ? publicID : "",
        invalidate: true,
        overwrite: true,
        folder: "tweets_media",
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      },
    );

    const { Readable } = require("stream");

    (async () => {
      const stream = Readable.from(await file.arrayBuffer());
      stream.pipe(cld_upload_stream);
    })();
  });
}
