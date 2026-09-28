import React, { useState } from 'react';
import { ItemReport, EmailLog, User, SmtpConfigStatus } from '../types';
import { 
  Mail, 
  Shield, 
  Database, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send,
  Server, 
  Eye,
  Tag,
  MapPin,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  AtSign,
  Sparkles,
  Inbox,
  AlertTriangle,
  Home,
  Trash2,
  X
} from 'lucide-react';

interface AdminDashboardProps {
  reports: ItemReport[];
  emailLogs: EmailLog[];
  currentUser: User;
  smtpStatus: SmtpConfigStatus | null;
  onBackHome: () => void;
  onOpenReportDetail: (report: ItemReport) => void;
  onContactUser: (report: ItemReport) => void;
  onDeleteReport: (report: ItemReport) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reports,
  emailLogs,
  currentUser,
  smtpStatus,
  onBackHome,
  onOpenReportDetail,
  onContactUser,
  onDeleteReport,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'history' | 'smtp'>('reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportType, setSelectedReportType] = useState<'All' | 'Lost' | 'Found'>('All');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [messageTemplate, setMessageTemplate] = useState<'found' | 'not_found' | 'verify' | 'custom'>('found');
  const [customNote, setCustomNote] = useState<string>('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<{ url: string; name: string } | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const isFoundClassification = (report: ItemReport) => report.type === 'Found' || report.status === 'Resolved';
  const lostReports = reports.filter((r) => !isFoundClassification(r));
  const foundReports = reports.filter(isFoundClassification);

  const filteredReports = reports.filter((r) => {
    const matchesType =
      selectedReportType === 'All' ||
      (selectedReportType === 'Found' ? isFoundClassification(r) : !isFoundClassification(r));
    const matchesSearch =
      r.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporter_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporter_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Prioritize selected report or the first matching lost report
  const activeReport = 
    reports.find((r) => r.id === selectedReportId) || 
    filteredReports.find((r) => r.type === 'Lost') ||
    filteredReports[0] || 
    reports[0] || 
    null;

  const getEmailContent = (
    report: ItemReport,
    template: 'found' | 'not_found' | 'verify' | 'custom',
    customText?: string
  ) => {
    let subject = '';
    let messageBody = '';

    if (template === 'found') {
      subject = `[I FOUND - Good News!] We found your lost item: "${report.item_name}" (#${report.id})`;
      messageBody =
        customText?.trim() ||
        `Dear ${report.reporter_name},\n\nGreat news! We are pleased to inform you that your lost item, "${report.item_name}" (Report ID: #${report.id}), reported missing at ${report.location}, has been FOUND and safely turned over to campus administration custody!\n\nPlease visit the administration office during office hours with a valid student ID to claim your item.\n\nClaim Location: Campus Administration / Lost & Found Office (Room 102)\nOffice Hours: 8:00 AM - 5:00 PM (Monday - Friday)`;
    } else if (template === 'not_found') {
      subject = `[I FOUND - Search Update] Unable to locate lost item: "${report.item_name}" (#${report.id})`;
      messageBody =
        customText?.trim() ||
        `Dear ${report.reporter_name},\n\nWe are writing to give you an official status update regarding your lost item report for "${report.item_name}" (Report ID: #${report.id}) reported missing at ${report.location}.\n\nOur campus administration and security personnel have thoroughly searched the reported location and checked our surrendered inventory. At this time, we have not been able to find or locate your item.\n\nPlease rest assured that your report remains active on our campus monitoring registry. If anyone turns in your item or if a potential match is found, we will contact you immediately via this email.\n\nIf you have additional identifying details (photos, serial numbers, distinct markings) or if you have already recovered the item, please reply to this email.`;
    } else if (template === 'verify') {
      subject = `[I FOUND - Verification] Possible match for your lost "${report.item_name}" (#${report.id})`;
      messageBody =
        customText?.trim() ||
        `Dear ${report.reporter_name},\n\nAn item matching your lost report for "${report.item_name}" was turned into the administration office. To confirm ownership before release, please reply to this email or visit our office with identifying details (e.g. brand, color, serial number, passcode, or distinctive markings).`;
    } else {
      subject = `[I FOUND Campus Notification] Regarding your ${report.type} item: "${report.item_name}" (#${report.id})`;
      messageBody =
        customText?.trim() ||
        `Dear ${report.reporter_name},\n\nRegarding your ${report.type.toLowerCase()} item "${report.item_name}" (#${report.id}) at ${report.location}. Please reply or visit the campus administration office.`;
    }

    const fullBody = `${messageBody}\n\n--- Item Record Reference ---\nItem: ${report.item_name}\nReport Type: ${report.type}\nCategory: ${report.category}\nLocation: ${report.location}\nDate Reported: ${new Date(report.date_reported).toLocaleDateString()}\nStatus: ${report.status}\n\nBest regards,\n${currentUser.name}\nCampus Lost & Found Administration\nCentral Registry Office`;

    return { subject, messageBody, fullBody };
  };

  const openGmailDirect = (
    report: ItemReport,
    template: 'found' | 'not_found' | 'verify' | 'custom' = messageTemplate,
    customText?: string
  ) => {
    const { subject, fullBody } = getEmailContent(report, template, customText);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      report.reporter_email
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const filteredLogs = emailLogs.filter((l) => {
    return (
      l.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.item_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.admin_name && l.admin_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const failedCount = emailLogs.filter((l) => l.status === 'Failed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white text-stone-900 p-5 sm:p-6 rounded-lg shadow-sm border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackHome}
            className="px-3.5 py-2 bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold rounded-md border border-stone-900 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => {
            setActiveTab('reports');
            setSelectedReportType('All');
          }}
          className="group relative overflow-hidden text-left bg-white p-5 rounded-2xl border border-stone-200 shadow-[0_10px_30px_-18px_rgba(41,37,36,0.45)] hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_16px_32px_-18px_rgba(41,37,36,0.55)] transition-all duration-300 cursor-pointer"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-stone-100/80 transition-transform duration-300 group-hover:scale-125" />
          <div className="relative flex items-start justify-between">
            <div>
              <h2 className="mt-2 text-sm font-semibold text-stone-700">Total Reports</h2>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white shadow-sm">
              <Database className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="relative mt-5 flex items-end justify-between gap-3">
            <span className="text-4xl font-black tracking-tight text-stone-900">{reports.length}</span>
            <span className="pb-1 text-right text-[11px] font-medium leading-4 text-stone-400">All campus<br />items</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('reports');
            setSelectedReportType('Lost');
          }}
          className="group relative overflow-hidden text-left bg-rose-50/70 p-5 rounded-2xl border border-rose-100 shadow-[0_10px_30px_-18px_rgba(190,24,93,0.5)] hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_16px_32px_-18px_rgba(190,24,93,0.6)] transition-all duration-300 cursor-pointer"
        >
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-100/80 transition-transform duration-300 group-hover:scale-125" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <h2 className="mt-2 text-sm font-semibold text-rose-900">Lost Items</h2>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm ring-1 ring-rose-100">
              <Search className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="relative mt-5 flex items-end justify-between gap-3">
            <span className="text-4xl font-black tracking-tight text-rose-700">{lostReports.length}</span>
            <span className="pb-1 text-right text-[11px] font-semibold leading-4 text-rose-600">Needs a<br />finder</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('reports');
            setSelectedReportType('Found');
          }}
          className="group relative overflow-hidden text-left bg-emerald-50/70 p-5 rounded-2xl border border-emerald-100 shadow-[0_10px_30px_-18px_rgba(5,150,105,0.5)] hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_16px_32px_-18px_rgba(5,150,105,0.6)] transition-all duration-300 cursor-pointer"
        >
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100/80 transition-transform duration-300 group-hover:scale-125" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <h2 className="mt-2 text-sm font-semibold text-emerald-950">Found Items</h2>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="relative mt-5 flex items-end justify-between gap-3">
            <span className="text-4xl font-black tracking-tight text-emerald-700">{foundReports.length}</span>
            <span className="pb-1 text-right text-[11px] font-semibold leading-4 text-emerald-600">In office<br />custody</span>
          </div>
        </button>

      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2">
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white text-xs rounded-md border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Tab 1: Item Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-5">
          {/* Sub-filters for Lost / Found */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedReportType('All')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedReportType === 'All'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                All Reports ({reports.length})
              </button>

              <button
                onClick={() => setSelectedReportType('Lost')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedReportType === 'Lost'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Lost Items ({lostReports.length})</span>
              </button>

              <button
                onClick={() => setSelectedReportType('Found')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedReportType === 'Found'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Found Items ({foundReports.length})</span>
              </button>
            </div>

            <span className="text-xs text-stone-500 font-medium">
              Showing {filteredReports.length} of {reports.length} reports
            </span>
          </div>

          {false && (
          /* Admin Lost Item Recovery & Owner Gmail Locator */
          <div className="bg-stone-900 text-white rounded-lg p-5 sm:p-6 shadow-sm border border-stone-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-700 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-stone-800 text-red-400 border border-stone-700 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-tight flex items-center gap-2">
                    <span>Lost Item Recovery &amp; Owner Gmail Dispatcher</span>
                    <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded">
                      GMAIL DIRECT
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400">
                    Locate the user&apos;s registered Gmail address and notify them the moment their lost item is found.
                  </p>
                </div>
              </div>

              {/* Quick Report Selector */}
              {reports.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-xs font-semibold text-stone-300">Select Item:</label>
                  <select
                    value={activeReport?.id || ''}
                    onChange={(e) => setSelectedReportId(e.target.value)}
                    className="text-xs font-medium px-3 py-1.5 bg-stone-800 text-white rounded-md border border-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-400 max-w-[280px] truncate cursor-pointer"
                  >
                    <optgroup label="🔴 Lost Items (Looking for Owners)">
                      {lostReports.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.item_name} — {r.reporter_name} ({r.reporter_email})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🟢 Found Items">
                      {foundReports.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.item_name} — {r.reporter_name} ({r.reporter_email})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}
            </div>

            {activeReport ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                {/* Left: Owner & Item Quick Facts */}
                <div className="lg:col-span-5 bg-stone-800 rounded-md p-4 border border-stone-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                      Owner &amp; Item Details
                    </span>
                    <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeReport.type === 'Lost'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {activeReport.type === 'Lost' ? 'Lost Item (Awaiting Owner)' : 'Found Item'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-stone-400 block">Reporter / Owner:</span>
                    <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <span>{activeReport.reporter_name}</span>
                    </div>
                  </div>

                  {/* PROMINENT USER GMAIL DISPLAY WITH COPY */}
                  <div className="p-3 bg-stone-900 rounded-md border border-stone-700 space-y-1.5">
                    <span className="text-[11px] text-stone-400 flex items-center gap-1 font-semibold">
                      <AtSign className="w-3 h-3 text-red-400" />
                      <span>Owner&apos;s Registered Gmail:</span>
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 break-all">
                        {activeReport.reporter_email}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activeReport.reporter_email)}
                        className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-semibold rounded border border-stone-600 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                        title="Copy email to clipboard"
                      >
                        {copiedEmail === activeReport.reporter_email ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-stone-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-300 pt-1">
                    <div>
                      <span className="text-stone-400 block text-[10px]">Item Name:</span>
                      <strong className="text-white">{activeReport.item_name}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">Report ID:</span>
                      <strong className="font-mono text-stone-200">{activeReport.id}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">Location:</span>
                      <span className="text-stone-300">{activeReport.location}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">Date Reported:</span>
                      <span className="text-stone-300">
                        {new Date(activeReport.date_reported).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Message Template & Dispatch Controls */}
                <div className="lg:col-span-7 bg-stone-800 rounded-md p-4 border border-stone-700 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                        Select Notification Template
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Target: {activeReport.reporter_email}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMessageTemplate('found');
                          setCustomNote('');
                        }}
                        className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer text-center ${
                          messageTemplate === 'found'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-stone-900 text-stone-300 hover:bg-stone-750'
                        }`}
                      >
                        🎉 Item Found!
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMessageTemplate('not_found');
                          setCustomNote('');
                        }}
                        className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer text-center ${
                          messageTemplate === 'not_found'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-stone-900 text-stone-300 hover:bg-stone-750'
                        }`}
                      >
                        ⚠️ Can&apos;t Find Item
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMessageTemplate('verify');
                          setCustomNote('');
                        }}
                        className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer text-center ${
                          messageTemplate === 'verify'
                            ? 'bg-amber-500 text-stone-950 shadow-xs'
                            : 'bg-stone-900 text-stone-300 hover:bg-stone-750'
                        }`}
                      >
                        🔍 Verify Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setMessageTemplate('custom')}
                        className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer text-center ${
                          messageTemplate === 'custom'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-stone-900 text-stone-300 hover:bg-stone-750'
                        }`}
                      >
                        ✍️ Custom Note
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">
                        {messageTemplate === 'found'
                          ? 'Notification Preview (Admin Found Item Alert):'
                          : messageTemplate === 'not_found'
                          ? 'Notification Preview (Cannot Find Item - Search Update):'
                          : messageTemplate === 'verify'
                          ? 'Verification Message Preview:'
                          : 'Custom Note to Reporter:'}
                      </label>
                      <textarea
                        rows={3}
                        value={
                          customNote ||
                          getEmailContent(activeReport, messageTemplate).messageBody
                        }
                        onChange={(e) => setCustomNote(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-900 text-stone-200 rounded-md border border-stone-700 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 leading-relaxed font-sans"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => openGmailDirect(activeReport, messageTemplate, customNote)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      title="Open Gmail compose with recipient, subject, and body ready to send"
                    >
                      <Mail className="w-4 h-4 text-white" />
                      <span>Open in Gmail (Send to {activeReport.reporter_name})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onContactUser(activeReport)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-stone-700 hover:bg-stone-600 active:bg-stone-800 text-white text-xs font-semibold rounded-md border border-stone-600 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      title="Dispatch via campus SMTP server and record in PostgreSQL email_logs"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Server Dispatch (SMTP)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 py-1">No reports available to contact.</p>
            )}
          </div>
          )}

          {/* Reports Table / Card List */}
          <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-2">
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Report ID</th>
                    <th className="py-3.5 px-4">Item</th>
                    <th className="py-3.5 px-4">Reporter Name</th>
                    <th className="py-3.5 px-4">Owner&apos;s Gmail</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date Reported</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredReports.map((report) => {
                    const isSelected = activeReport?.id === report.id;
                    return (
                      <tr 
                        key={report.id} 
                        onClick={() => setSelectedReportId(report.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-50/50 hover:bg-amber-50/80 font-medium' 
                            : 'hover:bg-stone-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-800">
                          {report.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={report.image_url || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=120&q=80'}
                              alt=""
                              className="h-10 w-10 rounded-md border border-stone-200 object-cover"
                            />
                            <div>
                              <div className="font-semibold text-stone-900">{report.item_name}</div>
                              <div className="text-[11px] text-stone-400">{report.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-stone-900">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (report.reporter_avatar) {
                                  setPreviewAvatar({ url: report.reporter_avatar, name: report.reporter_name });
                                }
                              }}
                              className={`h-8 w-8 overflow-hidden rounded-full bg-stone-900 text-xs font-bold text-white flex items-center justify-center ${report.reporter_avatar ? 'cursor-zoom-in hover:ring-2 hover:ring-amber-400 hover:ring-offset-1' : 'cursor-default'} transition-all`}
                              aria-label={report.reporter_avatar ? `View ${report.reporter_name}'s profile photo` : `${report.reporter_name}'s profile photo unavailable`}
                              disabled={!report.reporter_avatar}
                            >
                              {report.reporter_avatar ? <img src={report.reporter_avatar} alt={`${report.reporter_name} profile`} className="h-full w-full object-cover" /> : report.reporter_name.charAt(0)}
                            </button>
                            <span>{report.reporter_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-stone-700 font-semibold text-xs">
                              {report.reporter_email}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(report.reporter_email)}
                              className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                              title="Copy Gmail"
                            >
                              {copiedEmail === report.reporter_email ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                              report.status === 'Resolved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {report.status === 'Resolved' ? 'Found' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                          {new Date(report.date_reported).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onOpenReportDetail(report)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete the report for "${report.item_name}"?`)) {
                                onDeleteReport(report);
                              }
                            }}
                            className="px-2.5 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-md transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Delete report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredReports.length === 0 && (
              <div className="text-center py-12 text-stone-500">
                <p className="font-medium">No matching reports found.</p>
                <p className="text-xs text-stone-400 mt-1">
                  Try searching for another item name, location, or user Gmail address.
                </p>
              </div>
            )}
          </div>

          {previewAvatar && (
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/80 p-6 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label={`${previewAvatar.name}'s profile photo`}
              onClick={() => setPreviewAvatar(null)}
            >
              <div className="relative max-h-[85vh] max-w-[min(90vw,28rem)]" onClick={(event) => event.stopPropagation()}>
                <img
                  src={previewAvatar.url}
                  alt={`${previewAvatar.name} profile`}
                  className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/20"
                />
                <button
                  type="button"
                  onClick={() => setPreviewAvatar(null)}
                  className="absolute -right-3 -top-3 rounded-full bg-white p-2 text-stone-700 shadow-lg transition-colors hover:bg-stone-100"
                  aria-label="Close profile photo preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Email History (The Core requirement) */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Email History Log (`email_logs` Table)
              </h2>
              <p className="text-xs text-stone-500">
                Audit trail of all administrative communications sent to reporters through Nodemailer/SMTP.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              {emailLogs.length} total messages logged
            </span>
          </div>

          <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Recipient</th>
                    <th className="py-3.5 px-4">Related Item</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Date Sent</th>
                    <th className="py-3.5 px-4">Admin Who Sent It</th>
                    <th className="py-3.5 px-4 text-right">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-stone-900">
                        {log.recipient_email}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-stone-700">
                        <span className="font-mono font-bold text-stone-900">{log.item_id}</span>
                        {log.item_name && (
                          <span className="text-[11px] text-stone-500 block truncate max-w-[160px]">
                            {log.item_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-800 max-w-xs truncate">
                        {log.subject}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            log.status === 'Sent'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {log.status === 'Sent' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                          )}
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                        {new Date(log.sent_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-stone-900">
                        {log.admin_name || 'System Administrator'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
                          title="View Message Content"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-stone-500 space-y-2">
                <Mail className="w-8 h-8 mx-auto text-stone-300" />
                <p className="font-medium">No email history found.</p>
                <p className="text-xs text-stone-400">
                  When administrators contact users about reports, records will appear here automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: SMTP & Database Config */}
      {activeTab === 'smtp' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMTP Configuration */}
          <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                SMTP Configuration (.env)
              </h3>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                  smtpStatus?.configured
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {smtpStatus?.configured ? 'Configured in .env' : 'Active (Fallback Dev Transporter)'}
              </span>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Emails are sent via Nodemailer. If `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, and `MAIL_PASSWORD` are specified in `.env`, the backend connects directly to Gmail SMTP.
            </p>

            <div className="space-y-2 bg-stone-50 p-4 rounded-md text-xs font-mono text-stone-700">
              <div className="flex justify-between">
                <span className="text-stone-500">MAIL_SERVER:</span>
                <span className="font-semibold">{smtpStatus?.host || '(Not set - using test transport)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">MAIL_PORT:</span>
                <span className="font-semibold">{smtpStatus?.port || 587}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">MAIL_USERNAME:</span>
                <span className="font-semibold">{smtpStatus?.hasUser ? '••••••••' : '(Not set)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">SMTP_FROM:</span>
                <span className="font-semibold">{smtpStatus?.from}</span>
              </div>
            </div>
          </div>

          {/* Database Info */}
          <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                PostgreSQL Schema Verification
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                PGlite / PostgreSQL Engine
              </span>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              All tables are verified and active in PostgreSQL with transactional relational keys between users, items, and logged email dispatches.
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-stone-50 rounded-md border border-stone-200 flex items-center justify-between">
                <span className="font-semibold text-stone-800">users Table</span>
                <span className="text-stone-500 font-mono">id, name, email, role</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-md border border-stone-200 flex items-center justify-between">
                <span className="font-semibold text-stone-800">items Table</span>
                <span className="text-stone-500 font-mono">id, user_id, item_name, type, ...</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-md border border-stone-200 flex items-center justify-between">
                <span className="font-semibold text-stone-800">email_logs Table</span>
                <span className="text-stone-500 font-mono">id, admin_id, user_id, status, ...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Email Log Content Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-stone-900">Email Dispatch Record #{selectedLog.id}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-stone-400 hover:text-stone-800 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-stone-500 block">Recipient:</span>
                <span className="font-mono font-bold text-stone-900">{selectedLog.recipient_email}</span>
              </div>
              <div>
                <span className="text-stone-500 block">Subject:</span>
                <span className="font-semibold text-stone-900">{selectedLog.subject}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-stone-500 block">Status:</span>
                  <span className="font-bold text-emerald-700">{selectedLog.status}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Sent At:</span>
                  <span className="text-stone-800">{new Date(selectedLog.sent_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="pt-2">
                <span className="text-stone-500 block mb-1">Message Body:</span>
                <div className="p-3 bg-stone-50 rounded-md border border-stone-200 font-mono text-stone-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {selectedLog.message}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-md text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
