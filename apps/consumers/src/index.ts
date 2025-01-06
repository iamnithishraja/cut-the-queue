import EmailConsumer from "./emailConsumer";
import NotificationConsumer from "./notificationConsumer";
import SMSConsumer from "./whatsappConsumer";

class ConsumerManager {
	private smsConsumer: SMSConsumer;
	private emailConsumer: EmailConsumer;
	private notificationConsumer: NotificationConsumer;

	constructor() {
		this.emailConsumer = new EmailConsumer();
		this.smsConsumer = new SMSConsumer();
		this.notificationConsumer = new NotificationConsumer();
	}

	async run(): Promise<void> {
		try {
			const consumerType = process.env.CONSUMER_TYPE;
			let activeConsumer;

			switch (consumerType) {
				case "email":
					activeConsumer = this.emailConsumer;
					break;
				case "sms":
					activeConsumer = this.smsConsumer;
					break;
				case "notification":
					activeConsumer = this.notificationConsumer;
					break;
				default:
					throw new Error("Invalid consumer type specified");
			}

			await activeConsumer.connect();
			await activeConsumer.start();
		} catch (error) {
			console.error("Error:", error);
			await this.disconnect();
		}
	}

	async disconnect(): Promise<void> {
		await this.emailConsumer.disconnect();
		await this.smsConsumer.disconnect();
		await this.notificationConsumer.disconnect();
	}
}

const consumerManager = new ConsumerManager();
consumerManager.run().catch(console.error);
