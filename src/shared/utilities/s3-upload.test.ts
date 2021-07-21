import { TokenServiceClient, S3Resource, Credentials } from "@concord-consortium/token-service";
import { IS3UploadParams, s3Upload, uniqueFilename } from "./s3-upload";

const putObject = jest.fn().mockImplementation(() => {
  return Promise.resolve();
});

jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3: jest.fn().mockImplementation(() => {
      return { putObject };
    }),
  };
});

describe("s3Upload", () => {
  it("should call AWS.S3.upload with correct arguments and return Cloudfront URL", async () => {
    const client = new TokenServiceClient({jwt: "test"});
    const resource: S3Resource = {
      id: "test",
      name: "image upload",
      description: "test image upload",
      type: "s3Folder",
      tool: "author-image-upload",
      accessRules: [],
      bucket: "test-bucket",
      folder: "test-folder",
      region: "test-region",
      publicPath: "test-folder/test/",
      publicUrl: "https://test-bucket.s3.amazonaws.com/test-folder/test/"
    };
    const credentials: Credentials = {
      accessKeyId: "test",
      expiration: new Date(),
      secretAccessKey: "test",
      sessionToken: "test"
    };
    const params: IS3UploadParams = {
      client,
      credentials,
      filename: "test.png",
      resource,
      body: "test",
      cacheControl: "max-age=123",
      contentType: "application/test"
    };
    const url = await s3Upload(params);
    expect(putObject).toHaveBeenCalledTimes(1);
    const expectedKey = `test-folder/test/test.png`;
    expect(putObject).toHaveBeenCalledWith({
      Bucket: "test-bucket",
      Key: expectedKey,
      Body: params.body,
      ContentEncoding: "UTF-8",
      ContentType: params.contentType,
      CacheControl: params.cacheControl
    });
    expect(url).toEqual(`https://test-bucket.s3.amazonaws.com/${expectedKey}`);
  });
});

describe("uniqueFilename", () => {
  it("prefixes the filename with a uuid", () => {
    const [prefix, filename] = uniqueFilename("test.png").split("-");
    expect(prefix.length).toEqual(32);
    expect(filename).toEqual("test.png");
  });
});