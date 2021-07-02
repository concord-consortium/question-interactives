import * as AWS from "@aws-sdk/client-s3";
import {v4 as uuid} from "uuid";

import { TokenServiceClient, S3Resource, Credentials } from "@concord-consortium/token-service";

export interface IS3UploadParams {
  client: TokenServiceClient;
  credentials: Credentials;
  filename: string;
  resource: S3Resource;
  body: any;
  contentType?: string;
  cacheControl?: string;
}

export const s3Upload = async ({client, credentials, filename, resource, body, contentType = "", cacheControl = ""}: IS3UploadParams): Promise<string> => {
  const {bucket, region} = resource;
  const s3 = new AWS.S3({region, credentials});
  const key = client.getPublicS3Path(resource, filename);
  await s3.putObject({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ContentEncoding: "UTF-8",
    CacheControl: cacheControl
  });
  return client.getPublicS3Url(resource, filename);
};

export const uniqueFilename = (filename: string) => `${uuid().replace(/-/g, "")}-${filename}`;