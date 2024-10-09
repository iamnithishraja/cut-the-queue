import { Message } from "kafkajs";

export interface KafkaMessage {
  topic: string;
  partition: number;
  message: Message;
}

export type MessageHandler = (message: KafkaMessage) => Promise<void>;
