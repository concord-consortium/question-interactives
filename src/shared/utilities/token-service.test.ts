import { TokenServiceClient } from "@concord-consortium/token-service";
import { AUTHOR_IMAGE_UPLOAD_TOOL_ID, getOrCreateUserImageUploadResource } from "./token-service";

describe("constants", () => {
  expect(AUTHOR_IMAGE_UPLOAD_TOOL_ID).toEqual("author-image-upload");
});

describe("getOrCreateUserImageUploadResource", () => {
  it("returns the first author-image-upload resource for the user", async () => {
    const listResources = jest.fn().mockImplementation(() => {
      return Promise.resolve(["first-resource"]);
    });
    const client = { listResources };

    const resource = await getOrCreateUserImageUploadResource(client as unknown as TokenServiceClient);
    expect(listResources).toHaveBeenCalledTimes(1);
    expect(resource).toEqual("first-resource");
  });

  it("calls createResource when there is no existing author-image-upload resource for the user", async () => {
    const listResources = jest.fn().mockImplementation(() => {
      return Promise.resolve([]);
    });
    const createResource = jest.fn().mockImplementation(() => {
      return Promise.resolve("created-resource");
    });
    const client = { listResources, createResource };

    const resource = await getOrCreateUserImageUploadResource(client as unknown as TokenServiceClient);
    expect(listResources).toHaveBeenCalledTimes(1);
    expect(createResource).toHaveBeenCalledTimes(1);
    expect(resource).toEqual("created-resource");
  });
});