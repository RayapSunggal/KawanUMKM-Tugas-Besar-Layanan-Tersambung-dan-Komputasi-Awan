import {
  SQSClient,
  SendMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { SqsJobMessage } from "../types/index.js";

const sqs = new SQSClient({ region: process.env.AWS_REGION ?? "us-east-1" });

const QUEUE_URL = process.env.SQS_QUEUE_URL ?? "";

export async function enqueueJob(message: SqsJobMessage): Promise<void> {
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(message),
      // Group ID tidak diperlukan untuk standard queue
    })
  );
}

export async function deleteMessage(receiptHandle: string): Promise<void> {
  await sqs.send(
    new DeleteMessageCommand({
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receiptHandle,
    })
  );
}
