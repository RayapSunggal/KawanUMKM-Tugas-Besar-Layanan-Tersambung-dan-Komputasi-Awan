import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Job, JobStatus, GenerationResult, AssetErrors } from "../types/index.js";

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1" });
const ddb = DynamoDBDocumentClient.from(client);

const TABLE = process.env.DYNAMODB_TABLE_NAME ?? "kawan-jobs";

// ─── Write ────────────────────────────────────────────────────────────────────

export async function putJob(job: Job): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: job,
    })
  );
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getJob(jobId: string): Promise<Job | null> {
  const { Item } = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { jobId },
    })
  );
  return (Item as Job) ?? null;
}

// ─── Update Status & Progress ─────────────────────────────────────────────────

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  progress: number
): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { jobId },
      UpdateExpression:
        "SET #status = :status, progress = :progress, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": status,
        ":progress": progress,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );
}

// ─── Save Generation Result ───────────────────────────────────────────────────

export async function saveJobResult(
  jobId: string,
  result: GenerationResult,
  assetErrors?: AssetErrors
): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { jobId },
      UpdateExpression:
        "SET #status = :status, progress = :progress, #result = :result, assetErrors = :assetErrors, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
        "#result": "result",
      },
      ExpressionAttributeValues: {
        ":status": "completed" as JobStatus,
        ":progress": 100,
        ":result": result,
        ":assetErrors": assetErrors ?? {},
        ":updatedAt": new Date().toISOString(),
      },
    })
  );
}

// ─── Mark Failed ─────────────────────────────────────────────────────────────

export async function failJob(jobId: string, errorMessage: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { jobId },
      UpdateExpression:
        "SET #status = :status, errorMessage = :msg, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": "failed" as JobStatus,
        ":msg": errorMessage,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );
}

// ─── List by Session (History) ────────────────────────────────────────────────

export async function listJobsBySession(sessionId: string): Promise<Job[]> {
  const { Items } = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "sessionId-createdAt-index",
      KeyConditionExpression: "sessionId = :sessionId",
      ExpressionAttributeValues: { ":sessionId": sessionId },
      ScanIndexForward: false, // terbaru dulu
    })
  );
  return (Items as Job[]) ?? [];
}
