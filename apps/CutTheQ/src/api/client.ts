import { create } from "apisauce";
import CookieManager from "@react-native-cookies/cookies";

const baseUrl = "http://192.168.1.6:3000";
const apiClient = create({
  baseURL: baseUrl,
});

export const getCookie = async (name: string) => {
  try {
    const cookies = await CookieManager.get(baseUrl);
    return cookies[name];
  } catch (error) {
    console.error("Error getting cookie:", error);
    return null;
  }
};

export const setCookie = async (name: string, value: string) => {
  try {
    await CookieManager.set(baseUrl, {
      name: name,
      value: value,
      path: "/",
    });
  } catch (error) {
    console.error("Error setting cookie:", error);
  }
};

export default apiClient;

apiClient.addAsyncRequestTransform(async (request) => {
  const authCookie = await getCookie("token");
  if (authCookie) {
    request.headers!["Cookie"] = `token=${authCookie.value}`;
  }
});
