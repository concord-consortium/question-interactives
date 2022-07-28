import { Firestore } from "@google-cloud/firestore";
import { BigBatch } from "@qualdesk/firestore-big-batch";
import { createTraverser } from '@firecode/admin';
import * as fs from "fs";
import { convertAnswer, getAnswerType, utcString } from "./utils";
import { ILARAAnonymousAnswerReportHash, ILARAAnswerReportHash } from "./types";
import { credentials, oldSourceKey, newSourceKey, batchedWrites, maxDocCount, startDate, endDate, convertLoggedInUserAnswers } from "./config.json";

process.env.GOOGLE_APPLICATION_CREDENTIALS = credentials;
if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  console.error("Missing or incorrect credentials - please create and download a credentials json file here: https://console.cloud.google.com/apis/credentials?project=report-service-pro&organizationId=264971417743");
  process.exit(1);
}

const logFile = `./log/info-${utcString()}.json`;
const errorFile = `./log/error-${utcString()}.json`;

const logLastLine = "]\n";

const writeToFile = (file: string, content: string) => {
  if (content === logLastLine) {
    content = "\n" + content;
  } else {
    content = ",\n" + content;
  }
  fs.appendFileSync(file, content);
};

const getErrorHandler = (id: string) => (error: Error) => {
  writeToFile(errorFile, JSON.stringify({
    sourceId: id,
    error: error.toString(),
    stack: error.stack
  }));
};

const log = (message: string) => {
  writeToFile(logFile, message);
};

const getAllQuestions = (resource: any) => {
  const result: any = [];

  const activities = resource.type === "sequence" ? resource.children : [ resource ];

  activities.forEach((activity: any) => {
    activity.children.forEach((section: any) => {
      section.children.forEach((page: any) => {
        page.children.forEach((question: any) => {
          result.push(question);
        });
      });
    });
  });

  return result;
};

// Create a new client
const executeScript = async () => {
  // {} is added so the log file is always correct correct
  fs.appendFileSync(logFile, `[\n{"logType": "info", "date": "${utcString()}"}`);
  fs.appendFileSync(errorFile, `[\n{"logType": "error", "date": "${utcString()}"}`);

  console.log("Answer conversion started");
  process.stdout.write("Progress: ");

  const startTime = performance.now();
  let copiedAnswersCount = 0;
  let processedActivitiesCount = 0;
  let processedQuestionsCount = 0;
  let maxAnswersPerQuestion = 0;

  const firestore = new Firestore();

  const answersRef = firestore.collection(`sources/${oldSourceKey}/answers`);

  const resourcesToMigrate = firestore
    .collection(`sources/${oldSourceKey}/resources`)
    .where("migration_status", "==", "migrated")
    // migration_test can be manually set in Firestore UI to limit conversion just to one activity.
    // .where ("migration_test", "==", "true")
    .where("created", ">=", startDate)
    .where("created", "<=", endDate);

  const resourcesTraverser = createTraverser(resourcesToMigrate, {
    batchSize: 1000,
    // This means we are prepared to hold batchSize * maxConcurrentBatchCount documents in memory.
    // We sacrifice some memory to traverse faster.
    maxConcurrentBatchCount: 3,
    // TODO: remove limit in the final script.
    maxDocCount
  });

  await resourcesTraverser.traverse(async (resourceBatchDocs) => {
    await Promise.all(resourceBatchDocs.map(async (resourceDoc) => {
      const activityErrorHandler = getErrorHandler(resourceDoc.id);
      try {
        const resource = resourceDoc.data();
        const questions = getAllQuestions(resource);
        let activityAnswersCount = 0;

        await Promise.all(questions.map(async (question: any) => {
          // TODO: remove in the final version of the script. This is only necessary in the early tests when questions
          // are not converted yet.
          // if (question.type === "multiple_choice" && !question.authored_state) {
          //   // We're processing old MC question. It's impossible to convert its answer without authored
          //   // state. Other question types can work without access to authored state.
          //   question = {
          //     ...question,
          //     authored_state: {
          //       choices: [
          //         {
          //           id: 1,
          //           content: "a",
          //           correct: true
          //         },
          //         {
          //           id: 2,
          //           content: "b"
          //         },
          //       ]
          //     }
          //   };
          // }

          let sourceQuestionId;
          if (question.legacy_id) {
            sourceQuestionId = question.legacy_id;
          } else {
            // This is case of the managed interactives. They are not converted. We just need to move answers
            // from one collection to another.
            sourceQuestionId = question.id;
          }

          let questionAnswers = answersRef
            .where("question_id", "==", sourceQuestionId);

          if (convertLoggedInUserAnswers) {
            // Look only for answers of logged in users.
            questionAnswers = questionAnswers
              .orderBy("platform_id") // Firestore requires orderBy while using != condition.
              .where("platform_id", "!=", null);
          } else {
            // Look only for answers of anonymous users.
            questionAnswers = questionAnswers
              .where("platform_id", "==", null);
          }

          const answersTraverser = createTraverser(questionAnswers, {
            // 500 is the max batched write size, but we use BigBatch helper so any value can work here.
            batchSize: 500,
            // This means we are prepared to hold batchSize * maxConcurrentBatchCount documents in memory.
            // We sacrifice some memory to traverse faster.
            maxConcurrentBatchCount: 5,
            sleepTimeBetweenBatches: 0
          });

          const { docCount: answerDocCount } = await answersTraverser.traverse(async (answerBatchDocs) => {

            const answersUpdateBatch = batchedWrites ? new BigBatch({ firestore }) : null;

            await Promise.all(answerBatchDocs.map(async (answerDoc) => {
              const answerErrorHandler = getErrorHandler(answerDoc.id);
              try {
                const answer = answerDoc.data() as ILARAAnswerReportHash | ILARAAnonymousAnswerReportHash;
                const answerType = getAnswerType(answer);
                if (!answerType) {
                  throw new Error(`unknown answer type: ${answer.id}`);
                }
                if (answerType === "labbook") {
                  // Do nothing, labbooks don't require conversions. Activities will be marked as defunct.
                  return;
                }

                const convertedAnswer = convertAnswer(answerType, {
                  oldAnswer: answer,
                  newQuestion: question,
                  oldSourceKey,
                  newSourceKey,
                  additionalMetadata: {}
                });

                const answerRef = firestore.collection(`sources/${newSourceKey}/answers`).doc(convertedAnswer.id);

                if (answersUpdateBatch) {
                  answersUpdateBatch.set(answerRef, convertedAnswer);
                } else {
                  await answerRef.set(convertedAnswer);
                }

                copiedAnswersCount += 1;
              } catch (error) {
                answerErrorHandler(error);
              }
            }));

            if (answersUpdateBatch) {
              await answersUpdateBatch.commit();
            }
          });

          maxAnswersPerQuestion = Math.max(maxAnswersPerQuestion, answerDocCount);
          activityAnswersCount += answerDocCount;
          processedQuestionsCount += 1;
        }));

        process.stdout.write(".");
        processedActivitiesCount += 1;

        log(JSON.stringify({
          activityId: resource.id,
          created: resource.created,
          questions: questions.length,
          answers: activityAnswersCount
        }));

      } catch (error) {
        activityErrorHandler(error);
      }
    }));
  });

  const durationInS = (performance.now() - startTime) / 1000;
  const activitySpeed = processedActivitiesCount / durationInS;
  const questionSpeed = processedQuestionsCount / durationInS;
  const answerSpeed = copiedAnswersCount / durationInS;

  const stats = {
    "elapsedTime": durationInS.toFixed(2),
    "processedActivities": processedActivitiesCount,
    "activitiesPerSecond": activitySpeed.toFixed(2),
    "processedQuestions": processedQuestionsCount,
    "questionsPerSecond": questionSpeed.toFixed(2),
    "copiedAnswers": copiedAnswersCount,
    "answersPerSecond": answerSpeed.toFixed(2),
    "maxAnswersPerQuestion": maxAnswersPerQuestion
  };

  console.log(`\n${JSON.stringify(stats, null, 2)}`);

  log(JSON.stringify(stats, null, 2));

  log(logLastLine);
  writeToFile(errorFile, logLastLine);
};

executeScript();
