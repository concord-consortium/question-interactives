import { S3Resource, TokenServiceClient } from "@concord-consortium/token-service";

const AUTHOR_IMAGE_UPLOAD_TOOL_ID = "author-image-upload";

export const getOrCreateUserImageUploadResource = async (client: TokenServiceClient): Promise<S3Resource> => {
  const resources = await client.listResources({type: "s3Folder", tool: AUTHOR_IMAGE_UPLOAD_TOOL_ID, amOwner: "true"});
  if (resources.length > 0) {
    return resources[0] as S3Resource;
  }
  return await client.createResource({
    name: "Author Image Upload Folder",
    description: "Image uploads for authors",
    type: "s3Folder",
    tool: AUTHOR_IMAGE_UPLOAD_TOOL_ID,
    accessRuleType: "user"
  }) as S3Resource;
};
