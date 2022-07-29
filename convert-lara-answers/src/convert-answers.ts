import * as fs from "fs";
import { Firestore, QueryDocumentSnapshot } from "@google-cloud/firestore";
import { BigBatch } from "@qualdesk/firestore-big-batch";
import { createTraverser } from '@firecode/admin';
import { convertAnswer, getAnswerType } from "./utils";
import { ILARAAnonymousAnswerReportHash, ILARAAnswerReportHash } from "./types";
import { finishLogging, initLogging, logError, logFailedResource, logFailedAnswer, logInfo, logProgress } from "./log-utils";

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

const MAX_ATTEMPTS = 5; // to process resource or answers batch
const ATTEMPT_DELAY = 1000;

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

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const firestore = new Firestore();

// Create a new client
const executeScript = async () => {
  initLogging(`answers-conversion-${configPath}`);

  logProgress("Answer conversion started\n");
  logProgress("Progress: ");

  const startTime = Date.now();
  let processedResourcesCount = 0;
  let processedQuestionsCount = 0;
  let maxAnswersPerQuestion = 0;
  let copiedAnswersCount = 0;
  let failedAnswersCount = 0;
  let malformedAnswers = 0;
  let failedResourcesCount = 0;

  const logPerformance = () => {
    const durationInS = (Date.now() - startTime) / 1000;
    const resourceSpeed = processedResourcesCount / durationInS;
    const questionSpeed = processedQuestionsCount / durationInS;
    const answerSpeed = copiedAnswersCount / durationInS;
    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    logProgress(`\nElapsed time: ${durationInS.toFixed(2)}\n`);
    logProgress(`Memory used: ${usedMemory.toFixed(2)} MB\n`);
    logProgress(`Successfully processed ${processedResourcesCount} resources, ${resourceSpeed.toFixed(2)} resources per second\n`);
    logProgress(`${failedResourcesCount} resources processing failed and will require reprocessing\n`);
    logProgress(`Processed ${processedQuestionsCount} questions, ${questionSpeed.toFixed(2)} questions per second\n`);

    logProgress(`Copied ${copiedAnswersCount} answers, ${answerSpeed.toFixed(2)} answers per second\n`);
    logProgress(`${failedAnswersCount} answers processing failed\n`);
    logProgress(`${malformedAnswers} answers were malformed and ignored\n`);
    logProgress(`Max answers per question: ${maxAnswersPerQuestion}\n`);
  };

  const answersRef = firestore.collection(`sources/${config.oldSourceKey}/answers`);

  const processResource = async (resourceDoc: QueryDocumentSnapshot) => {
    const execProcessResource = async (processResourceAttempt = 0) => {
      try {
        const resource = resourceDoc.data();
        const questions = getAllQuestions(resource);
        let resourceAnswersCount = 0;

        await Promise.all(questions.map(async (question: any) => {
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

          if (config.convertLoggedInUserAnswers) {
            // Look only for answers of logged in users.
            questionAnswers = questionAnswers
              .orderBy("platform_id") // Firestore requires orderBy while using != condition.
              .where("platform_id", "!=", null);
          } else {
            // Look only for answers of anonymous users.
            questionAnswers = questionAnswers
              .where("platform_id", "==", null);
          }

          const answersTraverser = createTraverser(questionAnswers, config.answersTraverser);

          let copiedAnswers = 0;

          const convertAnswersBatch = async (answerBatchDocs: QueryDocumentSnapshot[]) => {
            const execConvertAnswersBatch = async (convertAnswersBatchAttempt = 1) => {
              try {
                const answersUpdateBatch = new BigBatch({ firestore });

                answerBatchDocs.forEach(answerDoc => {
                  const answer = answerDoc.data() as ILARAAnswerReportHash | ILARAAnonymousAnswerReportHash;

                  try {
                    const answerType = getAnswerType(answer);
                    if (!answerType) {
                      throw new Error(`unknown answer type: ${answer.id}`);
                    }
                    if (answerType === "labbook") {
                      // Do nothing, labbooks don't require conversions. Resources will be marked as defunct.
                      return;
                    }

                    const convertedAnswer = convertAnswer(answerType, {
                      oldAnswer: answer,
                      newQuestion: question,
                      oldSourceKey: config.oldSourceKey,
                      newSourceKey: config.newSourceKey,
                      additionalMetadata: {}
                    });

                    const answerRef = firestore.collection(`sources/${config.newSourceKey}/answers`).doc(convertedAnswer.id);

                    answersUpdateBatch.set(answerRef, convertedAnswer);
                  } catch (error: any) {
                    // We can't do much here, probably answer doc was malformed.
                    malformedAnswers += 1;

                    if (!config.testRun) {
                      // if this was enabled in test run, it'd log all the MC answers
                      logFailedAnswer({
                        answer: answerDoc.id,
                        errorMessage: error.message
                      });
                    }
                  }
                });

                await answersUpdateBatch.commit();
                copiedAnswers += answerBatchDocs.length;
              } catch (error: any) {
                if (convertAnswersBatchAttempt < MAX_ATTEMPTS) {
                  logProgress("r");
                  await sleep(convertAnswersBatchAttempt * ATTEMPT_DELAY);
                  await execConvertAnswersBatch(convertAnswersBatchAttempt + 1);
                } else {
                  logError(`convertAnswersBatch attempt failed: ${question.id}`, error);
                }
              }
            };
            await execConvertAnswersBatch();
          };
          const { docCount: questionAnswersCount } = await answersTraverser.traverse(convertAnswersBatch);

          if (copiedAnswers < questionAnswersCount) {
            failedAnswersCount += questionAnswersCount - copiedAnswers;
            throw new Error(`not all answers have been copied successfully, resource: ${resource.id}, all answers: ${questionAnswersCount}, copied answers: ${copiedAnswers}`);
          }

          maxAnswersPerQuestion = Math.max(maxAnswersPerQuestion, questionAnswersCount);
          copiedAnswersCount += questionAnswersCount;
          resourceAnswersCount += questionAnswersCount;
          processedQuestionsCount += 1;
        }));

        logProgress(".");
        logInfo({
          resourceId: resource.id,
          created: resource.created,
          questions: questions.length,
          answers: resourceAnswersCount
        });
        processedResourcesCount += 1;

        if (processedResourcesCount % 250 === 0) {
          // 13k resources total, so it'll be logged ~50 times.
          logPerformance();
        }

      } catch (error: any) {
        if (processResourceAttempt < MAX_ATTEMPTS) {
          await sleep(processResourceAttempt * ATTEMPT_DELAY);
          await execProcessResource(processResourceAttempt + 1);
        } else {
          logError(`resource failed: ${resourceDoc.id}`, error);
          logFailedResource({
            resource: resourceDoc.id,
            errorMessage: error.message
          });
          logProgress("x");
          failedResourcesCount += 1;
        }
      }
    };
    await execProcessResource();
  };

  let resourcesToMigrate: any = firestore.collection(`sources/${config.oldSourceKey}/resources`);
  if (!config.testRun) {
    resourcesToMigrate = resourcesToMigrate.where("migration_status", "==", "migrated");
  }
  resourcesToMigrate = resourcesToMigrate
    .where("created", ">=", config.startDate)
    .where("created", "<=", config.endDate);

  const resourcesTraverser = createTraverser(resourcesToMigrate, config.resourcesTraverser);

  await resourcesTraverser.traverse(async (resourceBatchDocs) => {
    // Parallel variant:
    await Promise.all(resourceBatchDocs.map(processResource));
    // Synchronous variant. This + large maxConcurrentBatchCount seems to be less efficient.
    // for (const resourceDoc of resourceBatchDocs) {
    //   await processResource(resourceDoc);
    // }
  });

  logPerformance();
  finishLogging();
};

executeScript();
