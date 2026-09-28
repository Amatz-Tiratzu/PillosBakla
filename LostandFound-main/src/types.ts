export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at?: string;
  profile_image_url?: string | null;
}

export interface ItemReport {
  id: string; // e.g. "RPT-1042"
  user_id: number;
  reporter_name: string;
  reporter_email: string;
  item_name: string;
  category: string;
  type: 'Lost' | 'Found';
  location: string;
  date_reported: string;
  description: string;
  status: 'Open' | 'Resolved' | 'In Progress';
  image_url?: string;
  reporter_avatar?: string | null;
}

export interface EmailLog {
  id: number;
  admin_id: number;
  admin_name: string;
  user_id: number;
  item_id: string;
  recipient_email: string;
  subject: string;
  message: string;
  status: 'Sent' | 'Failed';
  error_message?: string | null;
  sent_at: string;
  item_name?: string;
  item_type?: 'Lost' | 'Found';
  report_type?: 'Lost' | 'Found';
  report_status?: 'Open' | 'Resolved' | 'In Progress';
}

export interface SendEmailPayload {
  admin_id: number;
  admin_name: string;
  user_id: number;
  item_id: string;
  recipient_email: string;
  subject: string;
  message: string;
}

export interface SmtpConfigStatus {
  configured: boolean;
  host: string;
  port: number;
  from: string;
  hasUser: boolean;
}
