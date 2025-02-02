---

# Consumers Service README

Welcome to the **Consumers Service**! This service listens to Kafka topics and processes messages for sending notifications through **SMS**, **Email**, and **WhatsApp**. Before you start running the application, make sure the environment is properly configured.

## Prerequisites

Before you start, make sure to load the environment variables that are required to run the service. The application uses these variables for Kafka connection details and for accessing external services like Twilio (SMS), Resend (Email), and WhatsApp API.

### Step 1: Environment Variables
You need to have a `.env` file in the root of your project with the necessary configuration values. These values will be loaded automatically using the `dotenv` library.

**Example `.env` file:**

```dotenv
# Resend API Key for email notifications
RESEND_API_KEY=""

# Twilio configuration for SMS and WhatsApp
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_WHATSAPP_FROM="your_twilio_messaging_phone_number"

# Kafka configuration
KAFKA_CLIENT_ID="your_kafka_client_id"
KAFKA_BROKER=http://localhost:9092  # Replace with your Kafka broker URL (e.g., docker-network:port)
CONSUMER_TYPE="sms"  # Options: "sms", "whatsapp", "email", or "notification"

# Firebase credentials (if used for notifications)
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""
FIREBASE_PROJECT_ID=""

# Additional Kafka configuration
KAFKA_BROKER="" 
KAFKA_CLIENT_ID="" 
CONSUMER_TYPE="" 
```

Make sure you replace the placeholder values with the actual credentials for your services.

## Available Scripts

You can use the following commands for building, developing, and running the service.

### `npm run build`

Build the project. This will compile the TypeScript files into JavaScript in the `dist/` folder. Use this command if you want to prepare the application for production.

```bash
npm run build
```

### `npm run dev`

For local development with automatic reloading, use `nodemon` to watch for file changes. This command will run the service in development mode.

```bash
npm run dev
```

### `npm start`

Start the service in production mode. This will run the already compiled JavaScript files located in the `dist/` directory.

```bash
npm start
```

## Dependencies

Here are the main dependencies and what they’re used for:

- **`dotenv`**: Loads environment variables from a `.env` file.
- **`firebase-admin`**: Used to manage Firebase interactions, if required for notifications.
- **`kafkajs`**: Kafka client library for consuming Kafka topics and processing incoming messages.
- **`resend`**: API client for sending emails via the Resend API.
- **`twilio`**: API client for sending SMS via Twilio.
- **`zod`**: Used for validating incoming data or requests before processing them.

## How It Works

The service consumes Kafka topics for SMS, Email, and WhatsApp notifications. Based on the message data, the service will trigger the appropriate notification API.

### Kafka Topics

The consumer listens to Kafka topics for messages that contain notification data. Each type of notification (SMS, Email, or WhatsApp) has its own Kafka topic.

When a message is received:

1. The service parses the message.
2. Depending on the type of notification (e.g., SMS, Email, or WhatsApp), the corresponding API is triggered to send the message.
   
### Example Workflows

- **SMS Notification (Twilio):**
  - A message is sent to a Kafka topic specifically for SMS.
  - The consumer picks up the message and sends it to the **Twilio** API to deliver the SMS.

- **Email Notification (Resend):**
  - A message is sent to a Kafka topic for email notifications.
  - The consumer picks up the message and sends it through the **Resend** API to deliver the email.

- **WhatsApp Notification:**
  - A message is sent to a Kafka topic for WhatsApp notifications.
  - The consumer picks up the message and sends it using the WhatsApp API.

## Development Tips

- **Automatic Reloading**: Use `npm run dev` for development to automatically reload the server whenever changes are made to the source files.
- **Error Handling**: If any message processing fails, ensure to check the logs for errors. You might need to verify the API keys and the format of incoming Kafka messages.

## Troubleshooting

- **Kafka Connection Issues**: If the service cannot connect to Kafka, check the `KAFKA_BROKER` and ensure the Kafka broker is accessible.
- **API Key Issues**: If the notifications are not sent, double-check the API keys in your `.env` file and ensure they are correct for Twilio, Resend, and WhatsApp.
- **Message Formatting**: Ensure that the Kafka message is in the correct format expected by the consumer. If validation fails, the service may not process the message properly.

## Conclusion

This service simplifies the process of sending notifications via SMS, Email, and WhatsApp by using Kafka as the messaging layer. Just ensure that your environment variables are set up correctly and you’re good to go!

If you encounter any issues or have questions, feel free to open an issue or contact the maintainers.

Happy coding! 🚀

---
