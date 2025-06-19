import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, content: string, html?: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      to,
      from: "Cut The Queue <support@cuttheq.in>",
      subject,
      text: content,
      html: html || generateDefaultHtml(content),
    });

    if (error) {
      throw error;
    }

    console.log(`Successfully sent email to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

function generateDefaultHtml(content: string): string {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto;">
        ${content}
      </div>
    </div>
  `;
}
