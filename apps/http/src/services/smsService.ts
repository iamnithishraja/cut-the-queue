import "dotenv/config";

/**
 * Sends an SMS notification to a phone number
 * 
 * @param to - Phone number to send SMS to
 * @param content - SMS content
 * @returns Promise resolving to boolean indicating success status
 */
export async function sendSMS(to: string, content: string): Promise<boolean> {
  try {
    const apiKey = process.env.TWO_FACTOR_API_KEY;
    const baseUrl = "https://2factor.in/API/V1";
    
    // Make sure phone number starts with +91 for Indian numbers if not already
    const phoneNumber = to.startsWith("+91") ? to : to.startsWith("91") ? `+${to}` : `+91${to}`;
    
    const url = `${baseUrl}/${apiKey}/SMS/${phoneNumber}/${content}`;
    
    const response = await fetch(url);
    
    if (response.ok) {
      console.log(`Successfully sent SMS to ${to}`);
      return true;
    } else {
      console.error(`Failed to send message: Status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}
