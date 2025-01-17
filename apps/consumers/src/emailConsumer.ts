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
				subject: "Verification Code - Cut The Queue",
				text: `Your verification code is: ${email.content}`,
				html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                        <h2>Cut The Queue - Verification Code</h2>
                        <div style="font-size: 24px; padding: 20px; background: #f5f5f5; margin: 20px 0;">
                            ${email.content}
                        </div>
                        <p>This code will expire in 10 minutes.</p>
                        <p>If you didn't request this code, please ignore this email.</p>
                    </div>
                `,
			});

			if (error) {
				throw error;
			}

			console.log(`Successfully sent OTP to ${email.to}`);
		} catch (error) {
			this.handleError(error, "Email");
		}
	}
}
