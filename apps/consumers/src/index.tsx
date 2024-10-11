import EmailConsumer from "./emailConsumer";
import SMSConsumer from "./smsConsumer";
import dotenv from "dotenv";
dotenv.config();

class ConsumerManager {
  private emailConsumer: EmailConsumer;
  private smsConsumer: SMSConsumer;

  constructor() {
    this.emailConsumer = new EmailConsumer();
    this.smsConsumer = new SMSConsumer();
  }

  async run(): Promise<void> {
    try {
      const consumerType = process.env.CONSUMER_TYPE;

      if (consumerType === "email") {
        await this.emailConsumer.connect();
        await this.emailConsumer.subscribe("email");
        await this.emailConsumer.run(this.emailConsumer.processMessage);
      } else if (consumerType === "sms") {
        await this.smsConsumer.connect();
        await this.smsConsumer.subscribe("sms");
        await this.smsConsumer.run(this.smsConsumer.processMessage);
      } else {
        throw new Error(
          "Invalid consumer type specified in environment variable"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      await this.disconnect();
    }
  }

  async disconnect(): Promise<void> {
    await this.emailConsumer.disconnect();
    await this.smsConsumer.disconnect();
  }
}

const consumerManager = new ConsumerManager();
consumerManager.run().catch(console.error);