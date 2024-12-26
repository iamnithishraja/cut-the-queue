import dotenv from "dotenv";
import twilio, { Twilio } from "twilio";
import { BaseMessageProcessor } from "./KafkaConsumerBase";
import { KafkaMessage, smsMessage, SMSMessage } from "./types";
dotenv.config();

export default class SMSConsumer extends BaseMessageProcessor<SMSMessage> {
	private client: Twilio;

	constructor() {
		super(smsMessage, "sms-group", "sms");
		const {
			TWILIO_ACCOUNT_SID,
			TWILIO_AUTH_TOKEN,
			TWILIO_MESSAGING_SERVICE_ID,
		} = process.env;
		this.validateEnvironmentVariables({
			TWILIO_ACCOUNT_SID,
			TWILIO_AUTH_TOKEN,
			TWILIO_MESSAGING_SERVICE_ID,
		});
		this.client = twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);
	}

	async processMessage({ message }: KafkaMessage): Promise<void> {
		try {
			const sms = this.parseMessage(message);
			await this.client.messages.create({
				body: sms.content,
				messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_ID,
				to: sms.to,
			});
			console.log(`Successfully sent SMS to ${sms.to}`);
		} catch (error) {
			this.handleError(error, "SMS");
		}
	}
}
