import { Kafka, Partitioners, Producer } from "kafkajs";
import dotenv from "dotenv";
dotenv.config();

export class KafkaPublisher {
  private static instance: KafkaPublisher;
  private kafka: Kafka;
  private producer: Producer;

  private constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || "default-client",
      brokers: [process.env.KAFKA_BROKER || "localhost:29092"],
    });
    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });
  }

  public clone(): never {
    throw new Error('KafkaPublisher is a singleton and cannot be cloned');
  }

  public static getInstance(): KafkaPublisher {
    if (!KafkaPublisher.instance) {
      KafkaPublisher.instance = new KafkaPublisher();
    }
    return KafkaPublisher.instance;
  }

  public async publishToKafka(topic: string, message: object): Promise<void> {
    try {
      await this.producer.connect();
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      console.log(`Message published to Kafka topic '${topic}':`, message);
    } catch (error) {
      console.error("Error publishing to Kafka:", error);
      throw new Error("Failed to publish message to Kafka");
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      console.log("Kafka producer disconnected.");
    } catch (error) {
      console.error("Error disconnecting Kafka producer:", error);
    }
  }
}

