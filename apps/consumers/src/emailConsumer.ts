import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import { BaseMessageProcessor } from "./KafkaConsumerBase";
import { EmailMessage, KafkaMessage } from "./types";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default class EmailConsumer extends BaseMessageProcessor<EmailMessage> {
	private readonly transporter: nodemailer.Transporter;

	constructor() {
		super(EmailMessage, "email-group", "email");
		const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
		console.log(GMAIL_USER, GMAIL_APP_PASSWORD);

		this.validateEnvironmentVariables({ GMAIL_USER, GMAIL_APP_PASSWORD });
		this.transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: GMAIL_USER,
				pass: GMAIL_APP_PASSWORD,
			},
		});
	}

	async processMessage({ message }: KafkaMessage): Promise<void> {
		try {
			const email = this.parseMessage(message);
			await this.transporter.sendMail({
				to: email.to,
				from: `Cut The Queue <${process.env.GMAIL_USER}>`,
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
			console.log(`Successfully sent OTP to ${email.to}`);
		} catch (error) {
			this.handleError(error, "Email");
		}
	}
}
