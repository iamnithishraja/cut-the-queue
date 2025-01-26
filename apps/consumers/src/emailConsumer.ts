import dotenv from "dotenv";
import path from "path";
import { Resend } from "resend";
import { BaseMessageProcessor } from "./KafkaConsumerBase";
import { EmailMessage, KafkaMessage } from "./types";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default class EmailConsumer extends BaseMessageProcessor<EmailMessage> {
	private readonly resend: Resend;

	constructor() {
		super(EmailMessage, "email-group", "email");
		const { RESEND_API_KEY } = process.env;

		this.validateEnvironmentVariables({ RESEND_API_KEY });
		this.resend = new Resend(RESEND_API_KEY);
	}

	async processMessage({ message }: KafkaMessage): Promise<void> {
		try {
			const email = this.parseMessage(message);
			const { error } = await this.resend.emails.send({
				to: email.to,
				from: "Cut The Queue <support@cuttheq.in>",
				subject: email.subject,
				text: email.content,
				html: email.html || this.generateDefaultHtml(email.content),
			});

			if (error) {
				throw error;
			}

			console.log(`Successfully sent email to ${email.to}`);
		} catch (error) {
			this.handleError(error, "Email");
		}
	}

	private generateDefaultHtml(content: string): string {
		return `
			<div style="font-family: Arial, sans-serif; padding: 20px;">
				<div style="max-width: 600px; margin: 0 auto;">
					${content}
				</div>
			</div>
		`;
	}
}
