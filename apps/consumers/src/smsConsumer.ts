import KafkaConsumerBase from "./KafkaConsumerBase";
import { KafkaMessage, smsMessage, SMSMessage } from "./types";
import { MessagesApi, Configuration, MessageRequest } from "bandwidth-sdk";
import dotenv from "dotenv";
dotenv.config();

export default class SMSConsumer extends KafkaConsumerBase {
  private readonly messagesApi: MessagesApi;
  private readonly accountId: string;
  private readonly applicationId: string;
  private readonly fromNumber: string;

  constructor() {
    super("sms-group");

    const {
      BW_ACCOUNT_ID,
      BW_MESSAGING_APPLICATION_ID,
      BW_NUMBER,
      BW_USERNAME,
      BW_PASSWORD,
    } = process.env;

    this.validateEnvironmentVariables({
      BW_ACCOUNT_ID,
      BW_MESSAGING_APPLICATION_ID,
      BW_NUMBER,
      BW_USERNAME,
      BW_PASSWORD,
    });

    this.accountId = BW_ACCOUNT_ID!;
    this.applicationId = BW_MESSAGING_APPLICATION_ID!;
    this.fromNumber = BW_NUMBER!;

    const config = new Configuration({
      username: BW_USERNAME,
      password: BW_PASSWORD,
    });

    this.messagesApi = new MessagesApi(config);
  }

  private validateEnvironmentVariables(
    envVars: Record<string, string | undefined>
  ): void {
    const missingVars = Object.entries(envVars)
      .filter(([_, value]) => value === undefined)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing environment variables: ${missingVars.join(", ")}`
      );
    }
  }

  async processMessage({ message }: KafkaMessage): Promise<void> {
    try {
      const parsedSms = this.parseSMSMessage(message);
      console.log(`Received SMS message: ${JSON.stringify(parsedSms)}`);

      await this.sendSMS(parsedSms);
      console.log(`Successfully sent SMS to ${parsedSms.to}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  private parseSMSMessage(message: KafkaMessage["message"]): SMSMessage {
    const messageValue = message.value?.toString();
    if (!messageValue) {
      throw new Error("Empty message value");
    }
    return smsMessage.parse(JSON.parse(messageValue));
  }

  private async sendSMS(smsMessage: SMSMessage): Promise<void> {
    const messageRequest: MessageRequest = {
      from: this.fromNumber,
      to: new Set<string>([smsMessage.to]),
      text: smsMessage.content,
      applicationId: this.applicationId,
    };

    await this.messagesApi.createMessage(this.accountId, messageRequest);
  }

  private handleError(error: unknown): void {
    console.error("Error processing SMS message:", error);

    if (error instanceof Error) {
      if (error.name === "ZodError") {
        console.error("Invalid message format:", error.message);
      } else {
        console.error("Unexpected error:", error.message);
      }
    }
  }
}
