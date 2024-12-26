import dotenv from "dotenv";
import * as admin from "firebase-admin";
import { BaseMessageProcessor } from "./KafkaConsumerBase";
import { KafkaMessage, NotificationMessage } from "./types";
dotenv.config();

export default class NotificationConsumer extends BaseMessageProcessor<NotificationMessage> {
	private readonly firebaseApp: admin.app.App;

	constructor() {
		super(NotificationMessage, "notification-group", "notification");
		const { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL } =
			process.env;
		this.validateEnvironmentVariables({
			FIREBASE_PROJECT_ID,
			FIREBASE_PRIVATE_KEY,
			FIREBASE_CLIENT_EMAIL,
		});

		this.firebaseApp = admin.initializeApp({
			credential: admin.credential.cert({
				projectId: FIREBASE_PROJECT_ID,
				privateKey: FIREBASE_PRIVATE_KEY!,
				clientEmail: FIREBASE_CLIENT_EMAIL,
			}),
		});
	}

	async processMessage({ message }: KafkaMessage): Promise<void> {
		try {
			const notification = this.parseMessage(message);
			await this.firebaseApp.messaging().send({
				token: notification.firebaseToken,
				title: notification.title,
				data: notification.data,
			});
			console.log(
				`Successfully sent notification to device: ${notification.firebaseToken}`
			);
		} catch (error) {
			this.handleError(error, "Notification");
		}
	}
}