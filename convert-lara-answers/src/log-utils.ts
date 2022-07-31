import * as fs from "fs";

class FileLogger {
  fd: number;
  jsonWritten = false;

  constructor(path: string) {
    this.fd = fs.openSync(path, "a");
  }

  write(content: string) {
    fs.appendFileSync(this.fd, content);
  }

  writeJSON(json: object) {
    const content = JSON.stringify(json);

    if (!this.jsonWritten) {
      this.write("[\n");
      this.write(content);
      this.jsonWritten = true;
    } else {
      this.write(",\n" + content);
    }
  }

  close() {
    if (this.jsonWritten) {
      this.write("\n]\n");
    }
    fs.closeSync(this.fd);
  }
}

let progressLogger: FileLogger;
let errorLogger: FileLogger;
let infoLogger: FileLogger;
let failedResourcesLogger: FileLogger;
let failedAnswersLogger: FileLogger;

export const initLogging = (name: string) => {
  const date = new Date().toISOString();

  progressLogger = new FileLogger(`./log/progress-${name}-${date}.txt`);
  errorLogger = new FileLogger(`./log/error-${name}-${date}.txt`);
  infoLogger = new FileLogger(`./log/info-${name}-${date}.json`);
  failedResourcesLogger = new FileLogger(`./log/failedResources-${name}-${date}.json`);
  failedAnswersLogger = new FileLogger(`./log/failedAnswers-${name}-${date}.json`);
};

export const finishLogging = () => {
  // Close JSON log files.
  progressLogger.close();
  errorLogger.close();
  infoLogger.close();
  failedResourcesLogger.close();
  failedAnswersLogger.close();
};

export const logProgress = (message: string) => {
  progressLogger.write(message);
  process.stdout.write(message);
};

export const logError = (message: string, error: Error) => {
  errorLogger.write(`\n${message}\n${error.message}\n${error.stack}\n`);
};

export const logInfo = (json: object) => {
  infoLogger.writeJSON(json);
};

export const logFailedResource = (json: object) => {
  failedResourcesLogger.writeJSON(json);
};

export const logFailedAnswer = (json: object) => {
  failedAnswersLogger.writeJSON(json);
};
