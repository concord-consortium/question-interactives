import { useEffect, useState } from "react";

export const isImgCORSEnabled = (imgSrc: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
    img.onload = () => resolve(true);
    img.onabort = () => resolve(false);
    img.onerror = () => resolve(false);
  });
};

export const shouldUseLARAImgProxy = (imgSrc?: string): boolean => {
  try {
    const url = new URL(imgSrc || "");
    const host = url.host;
    if (!host.match(/concord\.org/) && !host.match(/concordqa\.org/)) {
      // Use LARA image proxy to avoid tainting canvas when external image URL is used.
      // Note that concord.org domain is actually not enough when the subdomains are different.
      // So, the host needs to have CORS headers enabled. It's more likely for servers owned by CC. In practice
      // it should be mostly AWS S3 bucket with a concord.org domain.
      return true;
    }
  } catch (e) {
    // Malformed URL, ignore it.
  }
  return false;
};

export const useCorsImageErrorCheck = ({ performTest, imgSrc }: { performTest: boolean, imgSrc?: string }): boolean => {
  const [error, setError ] = useState<boolean>(false);

  useEffect(() => {
    // It doesn't make sense to test images proxied by LARA image proxy, as they will work.
    if (performTest && imgSrc && !shouldUseLARAImgProxy(imgSrc)) {
      isImgCORSEnabled(imgSrc).then(testResult => {
        setError(!testResult);
      });
    }
  }, [performTest, imgSrc]);

  return error;
};
