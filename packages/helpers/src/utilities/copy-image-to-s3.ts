import Shutterbug from "shutterbug";

export const copyImageToS3 = (imgSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.src = imgSrc;
    img.onload = () => {
      // Image needs to be in DOM tree just for a moment, so Shutterbug worker can process it correctly.
      document.body.append(img);
      Shutterbug.snapshot({
        selector: img,
        done: (url: string) => {
          resolve(url);
        },
        fail: (jqXHR: any, textStatus: string, errorThrown: any) => {
          reject(`Shutterbug request failed, ${textStatus}, error: ${errorThrown}`);
        }
      });
      img.remove();
    };
  });
};

export const copyLocalImageToS3 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const [major] = file.type.split("/");
    if (major !== "image") {
      reject("Sorry, you can only upload images");
    }
    if (!window.FileReader) {
      reject("Sorry, your browser does not support reading local files");
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataSrc = reader.result?.toString();
      if (dataSrc) {
        copyImageToS3(dataSrc)
          .then(url => resolve(url))
          .catch(error => reject(error));
      }
    };
    reader.onerror = () => {
      reject("FileReader error " + reader.error?.message);
    };
    reader.readAsDataURL(file);
  });
};

