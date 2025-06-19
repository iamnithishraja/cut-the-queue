import "dotenv/config";
import admin from "firebase-admin";

const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/gm, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

export async function sendPushNotification(
  token: string, 
  title: string, 
  body?: string, 
  data?: Record<string, string>
): Promise<boolean> {
  try {
    await firebaseApp.messaging().send({
      token,
      notification: {
        title,
        body,
      },
      data,
    });
    console.log(`Successfully sent push notification to device: ${token}`);
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}
