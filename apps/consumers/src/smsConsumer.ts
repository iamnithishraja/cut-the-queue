import axios from "axios";
import dotenv from "dotenv";
import { BaseMessageProcessor } from "./KafkaConsumerBase";
import { KafkaMessage, smsMessage, SMSMessage } from "./types";

dotenv.config();

export default class SMSConsumer extends BaseMessageProcessor<SMSMessage> {
	private apiKey: string;
	private baseUrl: string;

	constructor() {
		super(smsMessage, "sms-group", "sms");
		const { TWO_FACTOR_API_KEY } =
			process.env;

		this.validateEnvironmentVariables({
			TWO_FACTOR_API_KEY,
		});

		this.apiKey = TWO_FACTOR_API_KEY!;
		this.baseUrl = "https://2factor.in/API/V1";
	}

	async processMessage({ message }: KafkaMessage): Promise<void> {
		try {
			const sms = this.parseMessage(message);
			const url = `${this.baseUrl}/${this.apiKey}/SMS/${sms.to}/${sms.content}`;

			const response = await axios.get(url);

			if (response.status === 200) {
				console.log(`Successfully sent SMS to ${sms.to}`);
			} else {
				throw new Error(`Failed to send message: ${response.statusText}`);
			}
		} catch (error) {
			this.handleError(error, "SMS");
		}
	}
}
