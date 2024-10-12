import KafkaConsumerBase from "./KafkaConsumerBase";
import { KafkaMessage, smsMessage, SMSMessage } from "./types";
import twilio, { Twilio } from "twilio";
import dotenv from "dotenv";
dotenv.config();

export default class SMSConsumer extends KafkaConsumerBase {
  private client: Twilio;
  private readonly messagingServiceSid: string;
  constructor() {
    super("sms-group");

    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_SID,
      TWILIO_MESSAGING_SERVICE_ID,
    } = process.env;

    this.validateEnvironmentVariables({
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_SID,
      TWILIO_MESSAGING_SERVICE_ID,
    });

    this.messagingServiceSid = TWILIO_MESSAGING_SERVICE_ID!;
    this.client = twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_SID!);
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
    const messageRequest = await this.client.messages
    .create({
        body: smsMessage.content,
        messagingServiceSid: this.messagingServiceSid,
        to: smsMessage.to
    })
    // add the logic to use the response 
    console.log(messageRequest);
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
