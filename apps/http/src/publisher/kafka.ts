import { Kafka } from "kafkajs";;
import { EmailMessage, SMSMessage } from "../types/types";

export default class KafkaProducer {
  private kafka;
  private producer;
  constructor(clientId: string) {
    this.kafka = new Kafka({
      clientId: clientId,
      brokers: ["localhost:9092"],
    });
    this.producer = this.kafka.producer();
  }
  async publishToKafka(
    topic: string,
    message: SMSMessage | EmailMessage
  ): Promise<void> {
    try {
      await this.producer.send({
        topic: topic,
        messages: [
          {
            value: JSON.stringify(message),
          },
        ],
      });
      console.log(`Message published to Kafka topic '${topic}':`, message);
    } catch (error) {
      console.error("Error publishing to Kafka:", error);
      throw new Error("Failed to publish message to Kafka");
    }
  }
}
