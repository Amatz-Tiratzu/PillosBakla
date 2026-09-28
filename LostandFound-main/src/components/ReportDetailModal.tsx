import React, { useState } from 'react';
import { ItemReport, User } from '../types';
import { X, Mail, MapPin, Calendar, Tag, Shield, FileText, User as UserIcon, Building, ArrowUpRight, Loader2, CheckCircle2 } from 'lucide-react';

interface ReportDetailModalProps {
  report: ItemReport;
  currentUser: User | null;
  onClose: () => void;
  onReportStatusUpdated?: (reportId: string, status: 'Open' | 'Resolved') => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  currentUser,
  onClose,
  onReportStatusUpdated,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [directMessage, setDirectMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [emailStatus, setEmailStatus] = useState<'Open' | 'Resolved'>(report.status === 'Resolved' ? 'Resolved' : 'Open');

  const formatDeliveryError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error || '');
    if (/ENETUNREACH|ETIMEDOUT|ESOCKET|ECONNREFUSED|SMTP/i.test(message)) {
      return 'Direct delivery failed. Configure a reachable email provider in the server .env, then try again.';
    }
    return message || 'Unable to send email directly.';
  };

  const sendCustomEmail = async () => {
    const message = directMessage.trim();
    if (!message) {
      setSendResult({ type: 'error', message: 'Write a message before sending.' });
      return;
    }

    if (!currentUser?.id || !isAdmin) {
      setSendResult({ type: 'error', message: 'Only an administrator can send this email.' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/admin/email-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: currentUser.id,
          user_id: report.user_id,
          item_id: report.id,
          subject: `[I FOUND] Update about your ${report.type.toLowerCase()} item: ${report.item_name}`,
          message,
          mark_found: emailStatus === 'Resolved',
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Unable to send email.');
      }

      setDirectMessage('');
      if (data.reportStatus === 'Resolved' || data.reportStatus === 'Open') {
        setEmailStatus(data.reportStatus);
        onReportStatusUpdated?.(report.id, data.reportStatus);
      }
      setSendResult({ type: 'success', message: `Email sent to ${report.reporter_email}.` });
    } catch (error: any) {
      setSendResult({ type: 'error', message: formatDeliveryError(error) });
    } finally {
      setIsSending(false);
    }
  };

  // Helper for reporter initials avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formattedDate = new Date(report.date_reported).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="report-detail-modal-card"
        className="bg-[#fffdf8] w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        {/* Clean Header Bar */}
        <div className="px-6 sm:px-8 py-5 border-b border-stone-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            {/* Status indicator pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-200 shadow-2xs text-xs font-semibold text-stone-800">
              <span 
                className={`w-2 h-2 rounded-full ${
                  report.type === 'Lost' ? 'bg-[#D75549]' : 'bg-[#3BA842]'
                }`} 
              />
              <span>{report.type} Item</span>
            </div>

            <span className="text-xs font-mono font-medium text-stone-400">
              #{report.id}
            </span>
          </div>

          <button
            id="btn-close-modal-x"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          
          {/* Item Spotlight: Photo & Essential Metadata */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-full sm:w-56 h-52 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm shrink-0">
              <img
                src={report.image_url || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80'}
                alt={report.item_name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-3.5 w-full">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl sm:text-3xl font-semibold text-stone-950 tracking-tight leading-snug">
                  {report.item_name}
                </h2>
              </div>

              {/* Metadata rows */}
              <div className="space-y-2 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="text-stone-500">Category:</span>
                  <span className="font-semibold text-stone-800">{report.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="text-stone-500">Location:</span>
                  <span className="font-semibold text-stone-800">{report.location}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="text-stone-500">Reported:</span>
                  <span className="font-medium text-stone-700">{formattedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section (cardless, pure typography and dividers) */}
          <div className="pt-4 border-t border-stone-200">
            <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-[0.14em] mb-2">
              Item Details &amp; Notes
            </h3>
            <p className="text-sm text-stone-700 leading-7 font-normal">
              {report.description || 'No additional details provided for this entry.'}
            </p>
          </div>

          {/* Reporter Profile Section (Professional Institutional Layout - No AI Clichés) */}
          <div className="pt-5 border-t border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-[0.14em]">
                Reporter Profile
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                    {getInitials(report.reporter_name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 leading-tight">
                      {report.reporter_name}
                    </h4>
                    <p className="text-xs font-mono text-stone-600 break-all select-all mt-0.5">
                      {report.reporter_email}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-start sm:items-end gap-1 text-xs text-stone-500">
                  <span>Record Reference:</span>
                  <span className="font-mono font-semibold text-stone-800 text-[11px]">
                    {report.id}
                  </span>
                </div>
              </div>

              {/* Admin Direct Contact Bar (Enabled for Administrators) */}
              {isAdmin && (
                <div className="mt-3 pt-3 border-t border-stone-200 space-y-3">
                  {sendResult && (
                    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${sendResult.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                      {sendResult.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Mail className="h-4 w-4 shrink-0" />}
                      <span>{sendResult.message}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label htmlFor="report-email-status" className="text-[11px] font-semibold text-stone-600 whitespace-nowrap">
                      Set item status:
                    </label>
                    <select
                      id="report-email-status"
                      value={emailStatus}
                      onChange={(event) => setEmailStatus(event.target.value as 'Open' | 'Resolved')}
                      disabled={isSending}
                      className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Open">Pending</option>
                      <option value="Resolved">Found Item</option>
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      value={directMessage}
                      onChange={(e) => setDirectMessage(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-white text-stone-900 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={sendCustomEmail}
                      disabled={isSending}
                      className="px-4 py-2 bg-stone-900 hover:bg-black active:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shrink-0"
                      title="Send custom message through the configured admin Gmail account"
                    >
                      {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 text-red-400" />}
                      <span>{isSending ? 'Sending...' : 'Send'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 py-4 bg-stone-50/70 border-t border-stone-200/80 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-stone-700 hover:text-stone-950 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          {!isAdmin && (
            <div className="flex items-center gap-2">
              {report.type === 'Found' ? (
                <a
                  href={`mailto:armandolegada12345@gmail.com?subject=${encodeURIComponent(`Claim request: ${report.item_name} [${report.id}]`)}&body=${encodeURIComponent(`Hello I FOUND Admin,\n\nI believe this found item may belong to me.\n\nItem: ${report.item_name}\nReport ID: ${report.id}\nLocation: ${report.location}\n\nPlease let me know how I can verify and claim it.`)}`}
                  className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-700"
                >
                  <Mail className="h-3.5 w-3.5 text-emerald-400" />
                  Contact Admin to Claim
                </a>
              ) : (
                <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-stone-400" />
                  <span>Official contact is restricted to authorized campus staff.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
