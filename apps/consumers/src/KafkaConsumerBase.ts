import { Kafka, Consumer } from "kafkajs";
import { MessageHandler, KafkaMessage } from "./types";
import dotenv from "dotenv";
dotenv.config();

export default class KafkaConsumerBase {
  protected kafka: Kafka;
  protected consumer: Consumer;

  constructor(groupId: string) {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || "your-client-id",
      brokers: [
        `${process.env.KAFKA_HOST || "kafka"}:${process.env.KAFKA_PORT || "9092"}`,
      ],
    });

    this.consumer = this.kafka.consumer({ groupId });
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
    console.log("Consumer connected");
  }

  async subscribe(topic: string): Promise<void> {
    await this.consumer.subscribe({ topic, fromBeginning: true });
    console.log(`Subscribed to topic: ${topic}`);
  }

  async run(messageHandler: MessageHandler): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: KafkaMessage) => {
        console.log(`Received message: ${message.value?.toString()}`);
        await messageHandler({ topic, partition, message });
      },
    });
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
    console.log("Consumer disconnected");
  }
}
