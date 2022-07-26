import { Firestore } from "@google-cloud/firestore";
import { BigBatch } from "@qualdesk/firestore-big-batch";
import { createTraverser } from '@firecode/admin';
import * as fs from "fs";
import { convertAnswer, getAnswerType, utcString } from "./utils";
import { ILARAAnonymousAnswerReportHash, ILARAAnswerReportHash } from "./types";
import { credentials, oldSourceKey, newSourceKey, resourceLinkId, batchedWrites, maxDocCount } from "./config.json";

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

const getAllQuestions = (activityOrSequence: any) => {
  const result: any = [];

  const activities = activityOrSequence.type === "sequence" ? activityOrSequence.children : [ activityOrSequence ];

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

  const activitiesToMigrate = firestore
    .collection(`sources/${oldSourceKey}/resources`)
    // TODO: .where("migration_status", "==", "complete") - confirm with Ethan when the main conversion is ready!
    // migration_test can be manually set in Firestore UI to limit conversion just to one activity.
    // .where ("migration_test", "==", "true")
    .orderBy("created", "desc");

  const activitiesTraverser = createTraverser(activitiesToMigrate, {
    batchSize: 5,
    // This means we are prepared to hold batchSize * maxConcurrentBatchCount documents in memory.
    // We sacrifice some memory to traverse faster.
    maxConcurrentBatchCount: 2,
    // TODO: remove limit in the final script.
    maxDocCount
  });

  await activitiesTraverser.traverse(async (activityBatchDocs) => {
    await Promise.all(activityBatchDocs.map(async (activityOrSequenceDoc) => {
      const activityErrorHandler = getErrorHandler(activityOrSequenceDoc.id);
      try {
        const activityOrSequence = activityOrSequenceDoc.data();

        // TODO: not necessary in the final conversion, as resource_url and resource_link_id won't change.
        const newResourceUrl = activityOrSequence.resource_url;

        const questions = getAllQuestions(activityOrSequence);

        let activityAnswersCount = 0;

        await Promise.all(questions.map(async (question: any) => {
          let safeQuestion = question;

          // TODO: remove in the final version of the script. This is only necessary in the early tests when questions
          // are not converted yet.
          if (question.type === "multiple_choice" && !question.authored_state) {
            // We're processing old MC question. It's impossible to convert its answer without authored
            // state. Other question types can work without access to authored state.
            safeQuestion = {
              ...question,
              authored_state: {
                choices: [
                  {
                    id: 1,
                    content: "a",
                    correct: true
                  },
                  {
                    id: 2,
                    content: "b"
                  },
                ]
              }
            };
          }

          let sourceQuestionId;
          if (question.legacy_id) {
            // TODO: update legacy_id to legacy_id + legacy_type when this data is available in Firestore
            sourceQuestionId = question.legacy_id;
          } else {
            // This is case of the managed interactives. They are not converted. We just need to move answers
            // from one collection to another.
            sourceQuestionId = question.id;
          }

          const questionAnswers = answersRef.where("question_id", "==", sourceQuestionId);

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
                  newQuestion: safeQuestion,
                  oldSourceKey,
                  newSourceKey,
                  // TODO: not necessary in the final conversion
                  additionalMetadata: {
                    resource_link_id: resourceLinkId,
                    resource_url: newResourceUrl
                  }
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
          activityId: activityOrSequence.id,
          created: activityOrSequence.created,
          questions: questions.length,
          answers: activityAnswersCount
        }));

      } catch (error) {
        activityErrorHandler(error);
      }
    }));
  });

  log(logLastLine);
  writeToFile(errorFile, logLastLine);

  const durationInS = (performance.now() - startTime) / 1000;
  const activitySpeed = processedActivitiesCount / durationInS;
  const questionSpeed = processedQuestionsCount / durationInS;
  const answerSpeed = copiedAnswersCount / durationInS;

  console.log(`\nElapsed time: ${durationInS.toFixed(2)} seconds`);
  console.log(`Processed ${processedActivitiesCount} activities, ${activitySpeed.toFixed(2)} activities per second`);
  console.log(`Processed ${processedQuestionsCount} questions, ${questionSpeed.toFixed(2)} questions per second`);
  console.log(`Copied ${copiedAnswersCount} answers, ${answerSpeed.toFixed(2)} answers per second`);
  console.log(`Max number of answers per question: ${maxAnswersPerQuestion}`);
};

executeScript();
