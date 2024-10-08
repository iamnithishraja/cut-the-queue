/** @type {import('tailwindcss').Config} */
import sharedConfig from "@repo/tailwind-config";
const content = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/*/.{js,jsx,ts,tsx}"],
  presets: [sharedConfig],
};

export default content;