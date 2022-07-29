import * as fs from "fs";

const firstJSONLine = "[";
const lastJSONLine = "]\n";

let progressFile = ""; // plain text
let errorFile = ""; // plain text

let infoFile = ""; // JSON
let isInfoFirstLine = true;

let failedFile = ""; // JSON
let isFailedFirstLine = true;

export const initLogging = (name: string) => {
  const date = new Date().toISOString();

  progressFile = `./log/progress-${name}-${date}.txt`;
  errorFile = `./log/error-${name}-${date}.txt`;

  infoFile = `./log/info-${name}-${date}.json`;
  failedFile = `./log/failed-${name}-${date}.json`;

  // {} is added so the log file is always correct correct
  fs.appendFileSync(infoFile, firstJSONLine);
  fs.appendFileSync(failedFile, firstJSONLine);
};

export const finishLogging = () => {
  // Close JSON log files.
  writeToJSONFile(infoFile, lastJSONLine);
  writeToJSONFile(failedFile, lastJSONLine);
};

const writeToJSONFile = (file: string, content: string) => {
  const firstLine = (file === infoFile && isInfoFirstLine) || (file === failedFile && isFailedFirstLine);
  if (firstLine || content === lastJSONLine) {
    content = "\n" + content;
    if (file === infoFile) {
      isInfoFirstLine = false;
    } else if (file === failedFile) {
      isFailedFirstLine = false;
    }
  } else {
    content = ",\n" + content;
  }
  fs.appendFileSync(file, content);
};

export const logProgress = (message: string) => {
  fs.appendFileSync(progressFile, message);
  process.stdout.write(message);
};

export const logError = (message: string, error: Error) => {
  fs.appendFileSync(errorFile, `\n${message}\n${error.message}\n${error.stack}\n`);
};

export const logInfo = (json: object) => {
  writeToJSONFile(infoFile, JSON.stringify(json));
};

export const logFailed = (json: object) => {
  writeToJSONFile(failedFile, JSON.stringify(json));
};
