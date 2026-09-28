import React, { useState, useEffect } from 'react';
import { User, ItemReport, EmailLog, SmtpConfigStatus } from './types';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { LoginView } from './components/LoginView';
import { AdminDashboard } from './components/AdminDashboard';
import { ContactUserModal } from './components/ContactUserModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { ReportItemModal } from './components/ReportItemModal';
import { ProfileView } from './components/ProfileView';
import { CheckCircle2, AlertCircle, Sparkles, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const savedUser = window.localStorage.getItem('ifound.currentUser');
      return savedUser ? (JSON.parse(savedUser) as User) : null;
    } catch {
      return null;
    }
  });
  const [currentView, setCurrentView] = useState<'home' | 'lost' | 'found' | 'admin' | 'profile' | 'login'>(
    currentUser ? 'home' : 'login',
  );
  const [reports, setReports] = useState<ItemReport[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [smtpStatus, setSmtpStatus] = useState<SmtpConfigStatus | null>(null);

  // Modals state
  const [detailReport, setDetailReport] = useState<ItemReport | null>(null);
  const [contactReport, setContactReport] = useState<ItemReport | null>(null);
  const [reportModalType, setReportModalType] = useState<'Lost' | 'Found' | null>(null);
  const [reportDraft, setReportDraft] = useState<ItemReport | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      // 1. Fetch Users
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAvailableUsers(usersData);
      }

      // 2. Fetch Reports
      const reportsRes = await fetch('/api/reports');
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData);
      }

      // 3. Fetch Email Logs
      const logsRes = await fetch('/api/admin/email-logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setEmailLogs(logsData);
      }

      // 4. Fetch SMTP Status
      const smtpRes = await fetch('/api/admin/smtp-status');
      if (smtpRes.ok) {
        const smtpData = await smtpRes.json();
        setSmtpStatus(smtpData);
      }
    } catch (err) {
      console.error('Error loading initial data from server:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (currentUser) {
      window.localStorage.setItem('ifound.currentUser', JSON.stringify(currentUser));
    } else {
      window.localStorage.removeItem('ifound.currentUser');
    }
  }, [currentUser]);

  const handleOpenContactUser = (report: ItemReport) => {
    setDetailReport(null); // Close detail modal if open
    setContactReport(report);
  };

  const handleEmailSentSuccess = (newLog: EmailLog) => {
    setContactReport(null);
    showToast('Email sent successfully.', 'success');
    // Prepend to emailLogs so it shows immediately in the Admin Dashboard
    setEmailLogs((prev) => [newLog, ...prev]);
    if (newLog.report_status || newLog.report_type) {
      setReports((prev) =>
        prev.map((report) => report.id === newLog.item_id
          ? {
              ...report,
              ...(newLog.report_status ? { status: newLog.report_status } : {}),
              ...(newLog.report_type ? { type: newLog.report_type } : {}),
            }
          : report),
      );
    }
  };

  const handleReportCreated = (newReport: ItemReport) => {
    setReportModalType(null);
    setReportDraft(null);
    setReports((prev) => [newReport, ...prev]);
    showToast(`Your ${newReport.type.toLowerCase()} item report has been published!`);
  };

  const handleDeleteReport = async (report: ItemReport) => {
    try {
      const response = await fetch(`/api/reports/${encodeURIComponent(report.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser?.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete report.');
      }
      setReports((prev) => prev.filter((item) => item.id !== report.id));
      setEmailLogs((prev) => prev.filter((log) => log.item_id !== report.id));
      showToast('Report deleted successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete report.', 'error');
    }
  };

  const handleAdminDeleteReport = async (report: ItemReport) => {
    try {
      const response = await fetch(`/api/reports/${encodeURIComponent(report.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: currentUser?.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete report.');
      }
      setReports((prev) => prev.filter((item) => item.id !== report.id));
      setEmailLogs((prev) => prev.filter((log) => log.item_id !== report.id));
      showToast('Report deleted successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete report.', 'error');
    }
  };

  const handleRepostReport = (report: ItemReport) => {
    setReportDraft(report);
    setReportModalType(report.type);
  };

  const handleUserRegistered = (newUser: User) => {
    setAvailableUsers((prev) => {
      if (prev.some((u) => u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase())) {
        return prev;
      }
      return [...prev, newUser];
    });
    setCurrentUser(newUser);
    setCurrentView('home');
    showToast(`Welcome, ${newUser.name}! Account registered successfully.`);
  };

  const handleProfilePhotoUpdated = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setAvailableUsers((prev) => prev.map((user) => user.id === updatedUser.id ? updatedUser : user));
    setReports((prev) => prev.map((report) => report.user_id === updatedUser.id
      ? { ...report, reporter_avatar: updatedUser.profile_image_url }
      : report));
    showToast('Profile photo updated.');
  };

  // Lost or Found specific filtered view
  const lostReports = reports.filter((r) => r.type === 'Lost');
  const foundReports = reports.filter((r) => r.type === 'Found');

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#FDEFEA] via-[#FAF6DE] to-[#E8F6C6] text-stone-900 font-sans flex flex-col selection:bg-emerald-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-sm font-bold ${
              toastMessage.type === 'success'
                ? 'bg-stone-900 text-white border-stone-800'
                : 'bg-rose-600 text-white border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-300" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Navigation: visible on Home and My Uploads */}
      {(currentView === 'home' || currentView === 'profile') && (
        <Navbar
          currentUser={currentUser}
          currentView={currentView === 'login' ? 'home' : (currentView as any)}
          onNavigate={(view) => setCurrentView(view)}
          onOpenReportModal={(type) => {
            setReportDraft(null);
            setReportModalType(type);
          }}
          onSignOut={() => {
            setCurrentUser(null);
            setCurrentView('login');
            showToast('Signed out successfully.');
          }}
          onOpenLogin={() => setCurrentView('login')}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'login' ? (
          <LoginView
            availableUsers={availableUsers}
            onLogin={(user) => {
              setCurrentUser(user);
              setCurrentView('home');
              showToast(`Signed in as ${user.name} (${user.role})`);
            }}
            onUserRegistered={handleUserRegistered}
          />
        ) : currentView === 'admin' ? (
          currentUser?.role === 'admin' ? (
            <AdminDashboard
              reports={reports}
              emailLogs={emailLogs}
              currentUser={currentUser}
              smtpStatus={smtpStatus}
              onBackHome={() => setCurrentView('home')}
              onOpenReportDetail={(report) => setDetailReport(report)}
              onContactUser={handleOpenContactUser}
              onDeleteReport={handleAdminDeleteReport}
            />
          ) : (
            <div className="min-h-[70vh] flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl p-8 border border-stone-200 shadow-xl text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center shadow-xs">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
                    Administrator Access Only
                  </h2>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    The Admin Control Center and Direct Contact Tools are restricted exclusively to authorized administrators.
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      const admin = availableUsers.find((u) => u.role === 'admin');
                      if (admin) {
                        setCurrentUser(admin);
                        showToast(`Signed in as ${admin.name} (Admin)`);
                      } else {
                        setCurrentView('login');
                      }
                    }}
                    className="w-full py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Sign In with Admin Account
                  </button>
                  <button
                    onClick={() => setCurrentView('home')}
                    className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Return to Public Directory
                  </button>
                </div>
              </div>
            </div>
          )
        ) : currentView === 'profile' ? (
          currentUser ? (
            <ProfileView
              currentUser={currentUser}
              userReports={reports.filter((r) => r.user_id === currentUser.id)}
              receivedLogs={emailLogs.filter(
                (l) => l.recipient_email.toLowerCase() === currentUser.email.toLowerCase()
              )}
              onOpenReportDetail={(report) => setDetailReport(report)}
              onDeleteReport={handleDeleteReport}
              onRepostReport={handleRepostReport}
              onProfilePhotoUpdated={handleProfilePhotoUpdated}
            />
          ) : (
            <LoginView
              availableUsers={availableUsers}
              onLogin={(user) => {
                setCurrentUser(user);
                setCurrentView('profile');
              }}
              onUserRegistered={handleUserRegistered}
            />
          )
        ) : currentView === 'lost' ? (
          <HomeView
            reports={lostReports}
            onOpenReportDetail={(report) => setDetailReport(report)}
            onOpenReportModal={(type) => {
              setReportDraft(null);
              setReportModalType(type);
            }}
          />
        ) : currentView === 'found' ? (
          <HomeView
            reports={foundReports}
            onOpenReportDetail={(report) => setDetailReport(report)}
            onOpenReportModal={(type) => {
              setReportDraft(null);
              setReportModalType(type);
            }}
          />
        ) : (
          <HomeView
            reports={reports}
            onOpenReportDetail={(report) => setDetailReport(report)}
            onOpenReportModal={(type) => {
              setReportDraft(null);
              setReportModalType(type);
            }}
          />
        )}
      </main>

      <footer className="border-t border-stone-200/80 bg-[#FAF9F5]/80 py-8" aria-hidden="true" />

      {/* Report Detail Modal */}
      {detailReport && (
        <ReportDetailModal
          report={detailReport}
          currentUser={currentUser}
          onClose={() => setDetailReport(null)}
          onReportStatusUpdated={(reportId, status) => {
            setReports((prev) =>
              prev.map((report) => (report.id === reportId ? { ...report, status } : report)),
            );
            setDetailReport((prev) => (prev?.id === reportId ? { ...prev, status } : prev));
          }}
        />
      )}

      {/* Contact User Email Modal */}
      {contactReport && currentUser && (
        <ContactUserModal
          report={contactReport}
          adminUser={currentUser}
          onClose={() => setContactReport(null)}
          onEmailSentSuccess={handleEmailSentSuccess}
        />
      )}

      {/* Submit Report Modal */}
      {reportModalType && (
        <ReportItemModal
          initialType={reportModalType}
          currentUser={currentUser}
          initialReport={reportDraft}
          onClose={() => {
            setReportModalType(null);
            setReportDraft(null);
          }}
          onReportCreated={handleReportCreated}
        />
      )}
    </div>
  );
}
