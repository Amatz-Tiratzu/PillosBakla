import React, { useState } from 'react';
import { ItemReport, User } from '../types';
import { Mail, X, Send, AlertCircle, CheckCircle2, Shield, Database, Sparkles, Loader2 } from 'lucide-react';

interface ContactUserModalProps {
  report: ItemReport;
  adminUser: User;
  onClose: () => void;
  onEmailSentSuccess: (log: any) => void;
}

export const ContactUserModal: React.FC<ContactUserModalProps> = ({
  report,
  adminUser,
  onClose,
  onEmailSentSuccess,
}) => {
  const defaultSubject = report.type === 'Lost'
    ? `Good News: We Found Your Lost Item "${report.item_name}" [${report.id}]`
    : `Regarding Your ${report.type} Item Report: ${report.item_name} [${report.id}]`;

  const defaultMessage = report.type === 'Lost'
    ? `Hello ${report.reporter_name},

Great news! We are pleased to inform you that your lost item, "${report.item_name}" (Report ID: ${report.id}), reported missing at ${report.location}, has been FOUND and is now safely in campus administration custody!

Claim Instructions:
• Custody Center: Campus Lost & Found Administration (Room 102)
• Office Hours: Monday - Friday, 8:00 AM - 5:00 PM
• Verification Requirement: Please present a valid Student ID or government-issued photo ID.

Best regards,
${adminUser.name}
I FOUND Administration Team`
    : `Hello ${report.reporter_name},

We are contacting you regarding your ${report.type.toLowerCase()} item report for "${report.item_name}" (Report ID: ${report.id}) filed on ${new Date(report.date_reported).toLocaleDateString()}.

Our administrative team has an update regarding this report. Please reply to this communication or visit the I FOUND Administrative Center at your earliest convenience.

Best regards,
${adminUser.name}
I FOUND Administration Team`;

  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [activePreset, setActivePreset] = useState<'found' | 'not_found' | 'verification' | 'general'>(
    report.type === 'Lost' ? 'found' : 'general'
  );
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Template Quick Switches
  const applyTemplate = (type: 'found' | 'not_found' | 'verification' | 'general') => {
    setActivePreset(type);
    switch (type) {
      case 'found':
        setSubject(`Good News: We Found Your Lost Item "${report.item_name}" [${report.id}]`);
        setMessage(`Hello ${report.reporter_name},

Great news! We are pleased to inform you that your lost item, "${report.item_name}" (Report ID: ${report.id}), reported missing at ${report.location}, has been FOUND and safely secured in campus administration custody.

Claim Information:
• Custody Center: Campus Lost & Found Office (Room 102)
• Office Hours: Monday - Friday, 8:00 AM - 5:00 PM
• Claim Requirement: Please present a valid Student ID or government-issued photo ID.

Best regards,
${adminUser.name}
I FOUND Administration Team`);
        break;

      case 'not_found':
        setSubject(`Search Update: Unable to Locate Lost Item "${report.item_name}" [${report.id}]`);
        setMessage(`Hello ${report.reporter_name},

We are contacting you to provide an official status update regarding your lost item report for "${report.item_name}" (Report ID: ${report.id}) filed on ${new Date(report.date_reported).toLocaleDateString()}.

Our campus administration and security staff have thoroughly searched the reported location (${report.location}) and checked all surrendered custody inventory at the Lost & Found central desk. At this time, we have not been able to find or locate your item.

Please rest assured that your report remains active on our campus monitoring registry. If anyone turns in your item or if a potential match is identified, we will reach out to you immediately at this email address.

If you have additional identifying marks (such as a serial number, distinctive engravings, or photo) that could assist our ongoing search, please reply directly to this email.

Best regards,
${adminUser.name}
I FOUND Administration Team`);
        break;

      case 'verification':
        setSubject(`Verification Details Required for Report ${report.id} (${report.item_name})`);
        setMessage(`Hello ${report.reporter_name},

We are reviewing your ${report.type.toLowerCase()} item report for "${report.item_name}" (ID: ${report.id}).

To help us verify and match this item accurately, could you please provide any additional identifying characteristics, such as unique scratches, serial numbers, passcode description, or photos?

Thank you for your cooperation.

Best regards,
${adminUser.name}
I FOUND Administration Team`);
        break;

      case 'general':
      default:
        setSubject(`Regarding Your ${report.type} Item Report: ${report.item_name} [${report.id}]`);
        setMessage(`Hello ${report.reporter_name},

We are contacting you regarding your ${report.type.toLowerCase()} item report for "${report.item_name}" (Report ID: ${report.id}) filed on ${new Date(report.date_reported).toLocaleDateString()}.

Our administrative team has an update regarding this report. Please reply to this communication or visit the I FOUND Administrative Center at your earliest convenience.

Best regards,
${adminUser.name}
I FOUND Administration Team`);
        break;
    }
  };

  const openInGmail = () => {
    const encSubject = encodeURIComponent(subject.trim());
    const encBody = encodeURIComponent(message.trim());
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(report.reporter_email)}&su=${encSubject}&body=${encBody}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMessage('Please provide both a subject and message.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/admin/email-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: adminUser.id,
          user_id: report.user_id,
          item_id: report.id,
          subject: subject.trim(),
          message: message.trim(),
          mark_found: activePreset === 'found',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Email sent successfully.');
        setTimeout(() => {
          onEmailSentSuccess({
            ...data.log,
            report_status: data.reportStatus,
            report_type: data.reportType,
          });
        }, 1200);
      } else {
        setErrorMessage(data.error || 'Unable to send email. Please try again.');
      }
    } catch (err: any) {
      console.error('Contact user failed:', err);
      setErrorMessage('Unable to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-[#FAF9F5] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Contact User</h2>
              <p className="text-xs text-stone-500">
                Dispatches an official administrative email to the registered reporter.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            disabled={isSending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Notifications */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-semibold flex items-center gap-3 shadow-xs animate-in zoom-in-95 duration-150">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-sm font-semibold flex items-center gap-3 shadow-xs animate-in zoom-in-95 duration-150">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Item Summary Pill */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-800">{report.item_name}</span>
              <span className="text-stone-400">&bull;</span>
              <span className="font-mono text-stone-600 font-semibold">{report.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  report.type === 'Lost'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {report.type}
              </span>
              <span className="text-stone-500">
                Reporter: <strong>{report.reporter_name}</strong>
              </span>
            </div>
          </div>

          <form id="contact-user-form" onSubmit={handleSendEmail} className="space-y-4">
            {/* Recipient Email (Automated from PostgreSQL) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Recipient
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified Campus Email
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={report.reporter_email}
                  readOnly
                  className="w-full px-4 py-2.5 bg-stone-100/90 text-stone-700 font-mono text-sm rounded-xl border border-stone-200 cursor-not-allowed select-all"
                />
              </div>
            </div>

            {/* Quick Templates */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-stone-700">
                  Select Email Scenario / Template:
                </span>
                <span className="text-[11px] text-stone-400 font-medium">
                  One-click auto-fill
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyTemplate('found')}
                  className={`px-2.5 py-2 text-sm font-medium font-serif leading-snug rounded-xl border transition-all cursor-pointer text-center ${
                    activePreset === 'found'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-emerald-50 text-stone-700 border-stone-200'
                  }`}
                >
                  Item Was Found
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('not_found')}
                  className={`px-2.5 py-2 text-sm font-medium font-serif leading-snug rounded-xl border transition-all cursor-pointer text-center ${
                    activePreset === 'not_found'
                      ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-rose-50 text-stone-700 border-stone-200'
                  }`}
                >
                  Can&apos;t Find Item
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('verification')}
                  className={`px-2.5 py-2 text-sm font-medium font-serif leading-snug rounded-xl border transition-all cursor-pointer text-center ${
                    activePreset === 'verification'
                      ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-amber-50 text-stone-700 border-stone-200'
                  }`}
                >
                  Need Details
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('general')}
                  className={`px-2.5 py-2 text-sm font-medium font-serif leading-snug rounded-xl border transition-all cursor-pointer text-center ${
                    activePreset === 'general'
                      ? 'bg-stone-800 border-stone-800 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  General Inquiry
                </button>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white text-stone-900 text-sm font-semibold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={7}
                className="w-full px-4 py-3 bg-white text-stone-900 text-sm font-normal rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans leading-relaxed"
              />
            </div>

            {/* Admin Signature Notice */}
            <div className="text-[11px] text-stone-500 bg-stone-50 p-3 rounded-lg border border-stone-200/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-stone-600" />
                Sender: <strong>{adminUser.name}</strong> ({adminUser.email})
              </span>
              <span className="text-stone-400">Activity saved to PostgreSQL</span>
            </div>
          </form>
        </div>

        {/* Footer Actions: [Cancel] [Open in Gmail] [Send Email] */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2.5 text-sm font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={openInGmail}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            title="Open compose window in your Gmail account"
          >
            <Mail className="w-4 h-4 text-white" />
            <span>Open in Gmail</span>
          </button>

          <button
            type="submit"
            form="contact-user-form"
            disabled={isSending}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 active:bg-black text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Sending via Backend...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Send via Server</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
