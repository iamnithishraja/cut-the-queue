export type SMSMessage = {
  to: string;
  content: string;
};

export type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  content: string;
  html?: string;
};
