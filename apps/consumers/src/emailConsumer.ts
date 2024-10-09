import KafkaConsumerBase from "./KafkaConsumerBase";
import { KafkaMessage } from "./types";

export default class EmailConsumer extends KafkaConsumerBase {
  constructor() {
    super("email-group");
  }

  async processMessage({ message }: KafkaMessage): Promise<void> {
    const emailContent = message.value?.toString();
    console.log(`Processing email: ${emailContent}`);
  }
}
