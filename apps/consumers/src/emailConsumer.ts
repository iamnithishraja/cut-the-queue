import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import { BaseMessageProcessor } from "./KafkaConsumerBase";
import { EmailMessage, KafkaMessage } from "./types";
dotenv.config();

export default class EmailConsumer extends BaseMessageProcessor<EmailMessage> {
	private readonly sendGridClient: typeof sgMail;

	constructor() {
		super(EmailMessage, "email-group", "email");
		const { SENDGRID_API_KEY } = process.env;
		this.validateEnvironmentVariables({ SENDGRID_API_KEY });
		this.sendGridClient = sgMail;
		this.sendGridClient.setApiKey(SENDGRID_API_KEY!);
	}

	async processMessage({ message }: KafkaMessage): Promise<void> {
		try {
			const email = this.parseMessage(message);
			await this.sendGridClient.send({
				to: email.to,
				from: email.from,
				subject: email.subject,
				text: email.content,
				html: email.html || email.content,
			});
			console.log(`Successfully sent email to ${email.to}`);
		} catch (error) {
			this.handleError(error, "Email");
		}
	}
}
