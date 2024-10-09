import { Kafka } from 'kafkajs';

// Create a new Kafka instance using environment variables
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'your-client-id', // Fallback to a default client ID
  brokers: [`${process.env.KAFKA_HOST || 'kafka'}:${process.env.KAFKA_PORT || 9092}`], // Use environment variables for broker address
});

// Create a consumer
const consumer = kafka.consumer({ groupId: 'email-group' });

const run = async () => {
  // Connect the consumer
  await consumer.connect();
  console.log('Consumer connected');

  // Subscribe to the SMS topic
  await consumer.subscribe({ topic: 'email', fromBeginning: true });

  // Run the consumer to handle incoming messages
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`Received message: ${message.value?.toString()}`);
      // Add your message handling logic here
    },
  });
};

// Run the consumer
run().catch(console.error);
