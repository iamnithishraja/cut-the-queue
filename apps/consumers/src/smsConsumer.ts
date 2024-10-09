import KafkaConsumerBase from "./KafkaConsumerBase";
import { KafkaMessage } from "./types";

export default class SMSConsumer extends KafkaConsumerBase {
  constructor() {
    super("sms-group");
  }

  async processMessage({ message }: KafkaMessage): Promise<void> {
    const smsContent = message.value?.toString();
    console.log(`Processing SMS: ${smsContent}`);
  }
}
