import { Kafka, Partitioners } from "kafkajs";;
import { EmailMessage, SMSMessage, NotificationMessage } from "../types/types";
import dotenv from "dotenv"
dotenv.config()

export default class KafkaProducer {
  private kafka;
  private producer;
  constructor(clientId: string) {
    this.kafka = new Kafka({
      clientId: clientId,
      brokers: [process.env.KAFKA_BROKER ? process.env.KAFKA_BROKER : "localhost:29092"],
    });
    this.producer = this.kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
  }
  async publishToKafka(topic: string, message: SMSMessage | EmailMessage | NotificationMessage): Promise<void> {
    try {
      await this.producer.connect();
      await this.producer.send({
        topic: topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      console.log(`Message published to Kafka topic '${topic}':`, message);
    } catch (error) {
      console.error("Error publishing to Kafka:", error);
      throw new Error("Failed to publish message to Kafka");
    }
  }
}
