import KafkaConsumerBase from "./KafkaConsumerBase";
import { KafkaMessage, EmailMessage } from "./types";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

export default class EmailConsumer extends KafkaConsumerBase {
  private readonly sendGridClient: typeof sgMail;

  constructor() {
    super("email-group");

    const { SENDGRID_API_KEY } = process.env;

    this.validateEnvironmentVariables({ SENDGRID_API_KEY });

    this.sendGridClient = sgMail;
    this.sendGridClient.setApiKey(SENDGRID_API_KEY!);
  }

  private validateEnvironmentVariables(envVars: Record<string, string | undefined>): void {
    const missingVars = Object.entries(envVars)
      .filter(([_, value]) => value === undefined)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
    }
  }

  async processMessage({ message }: KafkaMessage): Promise<void> {
    try {
      const parsedEmail = this.parseEmailMessage(message);
      console.log(`Received email message: ${JSON.stringify(parsedEmail)}`);

      await this.sendEmail(parsedEmail);
      console.log(`Successfully sent email to ${parsedEmail.to}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  private parseEmailMessage(message: KafkaMessage['message']): EmailMessage {
    const messageValue = message.value?.toString();
    if (!messageValue) {
      throw new Error("Empty message value");
    }
    return EmailMessage.parse(JSON.parse(messageValue));
  }

  private async sendEmail(emailMessage: EmailMessage): Promise<void> {
    const msg = {
      to: emailMessage.to,
      from: emailMessage.from,
      subject: emailMessage.subject,
      text: emailMessage.content,
      html: emailMessage.html || emailMessage.content, // Use HTML if provided, otherwise use plain text we will use this for representing invoice in tabular format
    };

    await this.sendGridClient.send(msg);
  }

  private handleError(error: unknown): void {
    console.error("Error processing email message:", error);

    if (error instanceof Error) {
      if (error.name === "ZodError") {
        console.error("Invalid message format:", error.message);
      } else {
        console.error("Unexpected error:", error.message);
      }
    }
  }
}