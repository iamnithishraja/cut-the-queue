import dotenv from "dotenv";
import twilio, { Twilio } from "twilio";
import { BaseMessageProcessor } from "./KafkaConsumerBase";
import { KafkaMessage, smsMessage as whatsappMessage, SMSMessage as WhatsAppMessage } from "./types";
dotenv.config();

export default class WhatsAppConsumer extends BaseMessageProcessor<WhatsAppMessage> {
    private client: Twilio;

    constructor() {
        super(whatsappMessage, "whatsapp-group", "whatsapp");
        const {
            TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN,
            TWILIO_WHATSAPP_FROM,
        } = process.env;
        this.validateEnvironmentVariables({
            TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN,
            TWILIO_WHATSAPP_FROM,
        });
        this.client = twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);
    }

    async processMessage({ message }: KafkaMessage): Promise<void> {
        try {
            const whatsapp = this.parseMessage(message);
            await this.client.messages.create({
                body: whatsapp.content,
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
                to: `whatsapp:${whatsapp.to}`,
            });
            console.log(`Successfully sent WhatsApp message to ${whatsapp.to}`);
        } catch (error) {
            this.handleError(error, "WhatsApp");
        }
    }
}
