import { BaseMessageProcessor } from "./KafkaConsumerBase";
import { KafkaMessage, smsMessage as whatsappMessage, SMSMessage as WhatsAppMessage } from "./types";
import axios from 'axios';
import dotenv from "dotenv";

dotenv.config();

export default class WhatsAppConsumer extends BaseMessageProcessor<WhatsAppMessage> {
    private apiUrl: string;
    private bearerToken: string;

    constructor() {
        super(whatsappMessage, "whatsapp-group", "whatsapp");
        const {
            ZYLA_API_TOKEN,
            ZYLA_API_URL = 'https://zylalabs.com/api/4631/whatsapp+otp+api/5710/send+otp'
        } = process.env;

        this.validateEnvironmentVariables({
            ZYLA_API_TOKEN,
            ZYLA_API_URL
        });

        this.apiUrl = ZYLA_API_URL;
        this.bearerToken = ZYLA_API_TOKEN!;
    }

    protected validateEnvironmentVariables(variables: Record<string, string | undefined>): void {
        const missingVariables = Object.entries(variables)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (missingVariables.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
        }
    }

    async processMessage({ message }: KafkaMessage): Promise<void> {
        try {
            const whatsapp = this.parseMessage(message);

            const response = await axios({
                method: 'POST',
                url: this.apiUrl,
                headers: {
                    'Authorization': `Bearer ${this.bearerToken}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    To: `whatsapp:${whatsapp.to}`,
                    ContentVariables: JSON.stringify({
                        "1": whatsapp.content,
                        "2": "CutTheQ"
                    })
                }
            });

            if (response.status === 200) {
                console.log(`Successfully sent WhatsApp message to ${whatsapp.to}`);
            } else {
                throw new Error(`Failed to send message: ${response.statusText}`);
            }
        } catch (error) {
            this.handleError(error, "WhatsApp");
        }
    }
}
