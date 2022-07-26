import { Firestore } from "@google-cloud/firestore";
import * as fs from "fs";
import { convertAnswer, getAnswerType, utcString } from "./utils";
import { credentials, oldSourceKey, newSourceKey, resourceLinkId } from "./config.json";
import { ILARAAnonymousAnswerReportHash, ILARAAnswerReportHash } from "./types";

process.env.GOOGLE_APPLICATION_CREDENTIALS = credentials;
if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  console.error("Missing or incorrect credentials - please create and download a credentials json file here: https://console.cloud.google.com/apis/credentials?project=report-service-pro&organizationId=264971417743");
  process.exit(1);
}

const logFile = `./log/info-${utcString()}.json`;
const errorFile = `./log/error-${utcString()}.json`;
const maxErrorLen = 1000; // characters

const writeToFile = (file: string, content: string) => {
  fs.appendFileSync(file, content);
};

const getErrorHandler = (id: string) => (error: Error) => {
  writeToFile(errorFile, `{"sourceId": "${id}", "error": "${error.toString().substring(0, maxErrorLen)}", "stack": "${error.stack?.substring(0, maxErrorLen)}"},\n`);
};

const log = (message: string) => {
  writeToFile(logFile, message);
};

const getAllQuestions = (activityResource: any) => {
  const result: any = [];

  activityResource.children.forEach((section: any) => {
    section.children.forEach((page: any) => {
      page.children.forEach((question: any) => {
        result.push(question);
      });
    });
  });
  return result;
};

// Create a new client
const executeScript = async () => {
  writeToFile(logFile, "[\n");
  writeToFile(errorFile, "[\n");

  const firestore = new Firestore();

  const activitiesRef = firestore.collection(`sources/${oldSourceKey}/resources`);
  const activityQuery = activitiesRef
    // TODO: .where("migration_status", "==", "complete") - confirm with Ethan when the main conversion is ready!
    .where ("migration_test", "==", "true");

  const activitiesSnapshot = await activityQuery.get();
  if (activitiesSnapshot.empty) {
    console.log('No matching activities.');
    return;
  }

  const answersRef = firestore.collection(`sources/${oldSourceKey}/answers`);

  await Promise.all(activitiesSnapshot.docs.map(async (activityDoc) => {
    const activityErrorHandler = getErrorHandler(activityDoc.id);

    try {
      const activity = activityDoc.data();
      // TODO: not necessary in the final conversion, as resource_url and resource_link_id won't change.
      const newResourceUrl = activity.resource_url;

      const questions = getAllQuestions(activity);

      await Promise.all(questions.map(async (question: any) => {
        // TODO: update legacy_id to legacy_id + legacy_type when this data is available in Firestore
        const answersQuery = answersRef.where("question_id", "==", question.legacy_id);
        const answersSnapshot = await answersQuery.get();

        await Promise.all(answersSnapshot.docs.map(async (answerDoc) => {
          const answerErrorHandler = getErrorHandler(answerDoc.id);
          try {
            const answer = answerDoc.data() as ILARAAnswerReportHash | ILARAAnonymousAnswerReportHash;
            const answerType = getAnswerType(answer);
            if (!answerType) {
              throw new Error(`unknown answer type: ${answer.id}`);
            }

            const convertedAnswer = convertAnswer(answerType, {
              oldAnswer: answer,
              newQuestion: question,
              oldSourceKey,
              newSourceKey,
              // TODO: not necessary in the final conversion
              additionalMetadata: {
                resource_link_id: resourceLinkId,
                resource_url: newResourceUrl
              }
            });

            await firestore
              .collection(`sources/${newSourceKey}/answers`)
              .doc(convertedAnswer.id)
              .set(convertedAnswer);

            log(`{"from": "${answer.id}", "to": "${convertedAnswer.id}"},\n`);

          } catch (error) {
            answerErrorHandler(error);
          }
        }));
      }));
    } catch (error) {
      activityErrorHandler(error);
    }
  }));

  writeToFile(logFile, "]\n");
  writeToFile(errorFile, "]\n");
};

executeScript();
