import * as fs from "fs";
import { Firestore, QueryDocumentSnapshot } from "@google-cloud/firestore";
import { createTraverser } from '@firecode/admin';
import { IConvertedAnswerMetadata, IConvertedFeedbackReportHash, IFeedbackReportHash, ILARAAnswerReportHash } from "./types";
import { finishLogging, initLogging, logError, logFailedAnswer, logProgress } from "./log-utils";
import { BigBatch } from "./big-batch";
import { getConvertedAnswerId } from "./conversion-helpers/convert-answer";

const configPath: string = process.argv[2] || "";
if (!fs.existsSync(configPath)) {
  console.error("Missing config file. Run this script with a path to config.json");
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath).toString());

process.env.GOOGLE_APPLICATION_CREDENTIALS = config.credentials;
if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS as string)) {
  console.error("Missing or incorrect credentials - please create and download a credentials json file here: https://console.cloud.google.com/apis/credentials?project=report-service-pro&organizationId=264971417743");
  process.exit(1);
}

const MAX_ATTEMPTS = 10;
const ATTEMPT_DELAY = 1000;

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const firestore = new Firestore();

// Create a new client
const executeScript = async () => {
  initLogging(`feedbacks-conversion-${configPath}`);

  logProgress("Feedback conversion started\n");
  logProgress("Progress: ");

  const startTime = Date.now();
  let processedFeedbacksCount = 0;
  let convertedFeedbacksCount = 0;
  let malformedFeedbacks = 0;
  let lastPerfLogTimestamp = 0;

  const logPerformance = () => {
    lastPerfLogTimestamp = Date.now();
    const durationInS = (lastPerfLogTimestamp - startTime) / 1000;
    const feedbackSpeed = processedFeedbacksCount / durationInS;
    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    logProgress(`\nElapsed time: ${durationInS.toFixed(0)} seconds\n`);
    logProgress(`Memory used: ${usedMemory.toFixed(2)} MB\n`);
    logProgress(`Processed ${processedFeedbacksCount} feedbacks, ${feedbackSpeed.toFixed(2)} feedbacks per second\n`);
    logProgress(`Converted ${convertedFeedbacksCount} feedbacks\n`);
    logProgress(`${malformedFeedbacks} feedbacks were malformed and ignored\n`);
  };

  const feedbacksPath = `sources/${config.oldSourceKey}/question_feedbacks`;
  const answersRef = firestore.collection(`sources/${config.newSourceKey}/answers`);

  const convertFeedbacksBatch = async (feedbackBatchDocs: QueryDocumentSnapshot[]) => {
    const execConvertFeedbacksBatch = async (convertFeedbacksBatchAttempt = 1) => {
      try {
        const maxOperations = convertFeedbacksBatchAttempt === 1 ? 500 : Math.ceil(500 / Math.pow(5, convertFeedbacksBatchAttempt));
        const feedbacksUpdateBatch = new BigBatch({ firestore, maxOperations });

        await Promise.all(feedbackBatchDocs.map(async (feedbackDoc) => {
          const feedback = feedbackDoc.data() as IFeedbackReportHash;

          processedFeedbacksCount += 1;

          const newAnswerId = getConvertedAnswerId(config.oldSourceKey, feedback.answerId);
          const newAnswer = (await answersRef.doc(newAnswerId).get()).data() as (IConvertedAnswerMetadata & ILARAAnswerReportHash);
          if (!newAnswer) {
            // Nothing to do, this feedback points to AP answers (or answer hasn't been converted for some reason,
            // but there's not much we can do at this point).
            return;
          }

          try {
            const convertedFeedback: IConvertedFeedbackReportHash = {
              ...feedback,

              legacyAnswerId: feedback.answerId,
              legacyQuestionId: feedback.questionId,

              answerId: newAnswerId,
              questionId: newAnswer.question_id,
            };

            const feedbackRef = firestore.collection(feedbacksPath).doc(convertedFeedback.answerId);
            feedbacksUpdateBatch.set(feedbackRef, convertedFeedback);
            convertedFeedbacksCount += 1;

          } catch (error: any) {
            // We can't do much here, probably feedback doc was malformed.
            malformedFeedbacks += 1;
            logFailedAnswer({
              feedback: feedbackDoc.id,
              errorMessage: error.message
            });
          }
        }));

        await feedbacksUpdateBatch.commit();

        logProgress(".");
        if ((Date.now() - lastPerfLogTimestamp) / 1000 > config.perfLogInterval) {
          logPerformance();
        }
      } catch (error: any) {
        if (convertFeedbacksBatchAttempt < MAX_ATTEMPTS) {
          logProgress("b" + convertFeedbacksBatchAttempt);
          await sleep(convertFeedbacksBatchAttempt * ATTEMPT_DELAY);
          await execConvertFeedbacksBatch(convertFeedbacksBatchAttempt + 1);
        } else {
          logError(`convertFeedbacksBatch attempt failed`, error);
        }
      }
    };
    await execConvertFeedbacksBatch();
  };

  const feedbacksToMigrate = firestore.collection(feedbacksPath);
  const feedbacksTraverser = createTraverser(feedbacksToMigrate, config.feedbacksTraverser);

  await feedbacksTraverser.traverse(convertFeedbacksBatch);

  logPerformance();
  finishLogging();
};

executeScript();
