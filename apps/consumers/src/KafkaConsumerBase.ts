import dotenv from "dotenv";
import { Consumer, EachMessagePayload, Kafka } from "kafkajs";
import { z } from "zod";
import { KafkaMessage } from "./types";
dotenv.config();

export abstract class BaseMessageProcessor<T> {
	protected kafka: Kafka;
	protected consumer: Consumer;

	constructor(
		protected schema: z.ZodType<T>,
		protected groupId: string,
		protected topic: string
	) {
		this.kafka = new Kafka({
			clientId: process.env.KAFKA_CLIENT_ID,
			brokers: [`${process.env.KAFKA_BROKER}`],
		});
		this.consumer = this.kafka.consumer({ groupId });
	}

	async connect(): Promise<void> {
		try {
			await this.consumer.connect();
			console.log("Consumer connected");
			await this.consumer.subscribe({
				topic: this.topic,
				fromBeginning: false,
			});
			console.log(`Subscribed to topic: ${this.topic}`);
		} catch (error) {
			console.error("Error connecting to Kafka:", error);
			throw error;
		}
	}

	async start(): Promise<void> {
		try {
			await this.consumer.run({
				eachMessage: async ({
					topic,
					partition,
					message,
				}: EachMessagePayload) => {
					console.log(
						`Received message on topic ${topic}, partition ${partition}`
					);
					await this.processMessage({ topic, partition, message });
				},
			});
		} catch (error) {
			console.error("Error running consumer:", error);
		}
	}

	async disconnect(): Promise<void> {
		try {
			await this.consumer.disconnect();
			console.log("Consumer disconnected");
		} catch (error) {
			console.error("Error disconnecting:", error);
			throw error;
		}
	}

	protected validateEnvironmentVariables(
		envVars: Record<string, string | undefined>
	): void {
		const missingVars = Object.entries(envVars)
			.filter(([_, value]) => !value)
			.map(([key]) => key);

		if (missingVars.length > 0) {
			throw new Error(
				`Missing environment variables: ${missingVars.join(", ")}`
			);
		}
	}

	protected parseMessage(message: KafkaMessage["message"]): T {
		const messageValue = message.value?.toString();
		if (!messageValue) {
			throw new Error("Empty message value");
		}
		return this.schema.parse(JSON.parse(messageValue));
	}

	protected handleError(error: unknown, serviceName: string): void {
		console.error(`Error processing ${serviceName} message:`, error);

		if (error instanceof Error) {
			if (error.name === "ZodError") {
				console.error("Invalid message format:", error.message);
			} else {
				console.error("Unexpected error:", error.message);
			}
		}
	}

	abstract processMessage(message: KafkaMessage): Promise<void>;
}
