import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import { MessageHandler, KafkaMessage } from "./types";
import dotenv from "dotenv";
dotenv.config();

export default class KafkaConsumerBase {
  protected kafka: Kafka;
  protected consumer: Consumer;

  constructor(groupId: string) {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID,
      brokers: [`${process.env.KAFKA_HOST}`],
    });

    this.consumer = this.kafka.consumer({ groupId });
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      console.log("Consumer connected");
    } catch (error) {
      console.error("Error connecting to Kafka:", error);
    }
  }

  async subscribe(topic: string): Promise<void> {
    try {
      await this.consumer.subscribe({ topic, fromBeginning: false });
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  async run(messageHandler: MessageHandler): Promise<void> {
    try {
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
          console.log(`Received message on topic ${topic}, partition ${partition}: ${message.value?.toString()}`);

          // Bind 'this' to the message handler in case it refers to class methods from subclasses
          await messageHandler.call(this, { topic, partition, message });
        },
      });
    } catch (error) {
      console.error("Error while running the consumer:", error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
      console.log("Consumer disconnected");
    } catch (error) {
      console.error("Error disconnecting the consumer:", error);
    }
  }
}
