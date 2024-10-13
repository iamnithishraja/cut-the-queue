import KafkaConsumerBase from "./KafkaConsumerBase";
import { KafkaMessage, smsMessage, SMSMessage } from "./types";
import twilio, { Twilio } from "twilio";
import dotenv from "dotenv";
dotenv.config();

export default class SMSConsumer extends KafkaConsumerBase {
  private client: Twilio;
  private readonly messagingServiceSid: string;
  private readonly accountID: string;
  private readonly authToken: string;
  
  constructor() {
    super("sms-group");
  
    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_MESSAGING_SERVICE_ID,
    } = process.env;
  
    // Validate environment variables
    this.validateEnvironmentVariables({
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_MESSAGING_SERVICE_ID,
    });

    // Initialize Twilio client
    this.accountID = TWILIO_ACCOUNT_SID!;
    this.authToken = TWILIO_AUTH_TOKEN!;
    this.messagingServiceSid = TWILIO_MESSAGING_SERVICE_ID!;
    this.client = twilio(this.accountID!, this.authToken!);
    
    // Bind methods to ensure correct 'this' context
    this.processMessage = this.processMessage.bind(this);
    this.handleError = this.handleError.bind(this);
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
    try {
      const messageRequest = await this.client.messages.create({
        body: smsMessage.content,
        messagingServiceSid: this.messagingServiceSid,
        to: smsMessage.to,
      });

      console.log("Twilio message response:", messageRequest);
    } catch (error) {
      console.error("Error sending SMS via Twilio:", error);
      throw error;  
    }
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
