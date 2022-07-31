import { DocumentReference, Firestore, SetOptions, WriteBatch } from "@google-cloud/firestore";

interface Options {
  firestore: Firestore;
  maxOperations: number;
}

export class BigBatch {
  private firestore: Firestore;
  private currentBatch: WriteBatch;
  private batchArray: Array<WriteBatch>;
  private operationCounter: number;
  private maxOperations: number;

  constructor({ firestore, maxOperations }: Options) {
    this.firestore = firestore;
    this.maxOperations = maxOperations || 500;
    this.currentBatch = firestore.batch();
    this.batchArray = [this.currentBatch];
    this.operationCounter = 0;
  }

  public set(
    ref: DocumentReference,
    data: object,
    options: SetOptions = {}
  ) {
    this.currentBatch.set(ref, data, options);
    this.operationCounter++;
    if (this.operationCounter === this.maxOperations) {
      this.currentBatch = this.firestore.batch();
      this.batchArray.push(this.currentBatch);
      this.operationCounter = 0;
    }
  }

  public update(ref: FirebaseFirestore.DocumentReference, data: object) {
    this.currentBatch.update(ref, data);
    this.operationCounter++;
    if (this.operationCounter === this.maxOperations) {
      this.currentBatch = this.firestore.batch();
      this.batchArray.push(this.currentBatch);
      this.operationCounter = 0;
    }
  }

  public delete(ref: FirebaseFirestore.DocumentReference) {
    this.currentBatch.delete(ref);
    this.operationCounter++;
    if (this.operationCounter === this.maxOperations) {
      this.currentBatch = this.firestore.batch();
      this.batchArray.push(this.currentBatch);
      this.operationCounter = 0;
    }
  }

  public commit() {
    const promises = this.batchArray.map((batch) => batch.commit());
    return Promise.all(promises);
  }
}
