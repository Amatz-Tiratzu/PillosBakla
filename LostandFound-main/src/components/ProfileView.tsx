import React, { useRef, useState } from 'react';
import { User, ItemReport, EmailLog } from '../types';
import { User as UserIcon, Mail, Shield, Package, Calendar, Database, ArrowRight, RotateCcw, Trash2, Camera, Loader2 } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  userReports: ItemReport[];
  receivedLogs: EmailLog[];
  onOpenReportDetail: (report: ItemReport) => void;
  onDeleteReport: (report: ItemReport) => void;
  onRepostReport: (report: ItemReport) => void;
  onProfilePhotoUpdated: (user: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  userReports,
  receivedLogs,
  onOpenReportDetail,
  onDeleteReport,
  onRepostReport,
  onProfilePhotoUpdated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handleProfilePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file.');
      return;
    }
    if (file.size > 2_500_000) {
      setPhotoError('Please choose an image smaller than 2.5 MB.');
      return;
    }

    setPhotoError(null);
    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch(`/api/users/${currentUser.id}/profile-photo`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_image_url: reader.result }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to save profile photo.');
        onProfilePhotoUpdated(data);
      } catch (error: any) {
        setPhotoError(error.message || 'Unable to save profile photo.');
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.onerror = () => {
      setPhotoError('Unable to read this image.');
      setIsUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header */}
      <div className="bg-white p-6 sm:p-7 border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 overflow-hidden rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              {currentUser.profile_image_url ? <img src={currentUser.profile_image_url} alt={`${currentUser.name} profile`} className="h-full w-full object-cover" /> : currentUser.name.charAt(0)}
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingPhoto} className="absolute -right-2 -bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-white shadow-md hover:bg-emerald-800 disabled:opacity-60" title="Upload profile photo">
              {isUploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePhoto} className="hidden" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-stone-900">{currentUser.name}</h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
              <Mail className="w-3.5 h-3.5 text-stone-400" />
              <span>{currentUser.email}</span>
            </div>
          </div>
        </div>
        {photoError && <p className="text-xs font-medium text-rose-700">{photoError}</p>}

      </div>

      {/* Reports submitted by this user */}
      <div className="bg-[#fffdf8] p-6 border border-stone-200/90 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-700" />
          My Reported Items ({userReports.length})
        </h2>

        {userReports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userReports.map((report) => (
              <div
                key={report.id}
                onClick={() => onOpenReportDetail(report)}
                className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg cursor-pointer transition-all duration-200"
              >
                <div className="relative h-36 overflow-hidden bg-stone-100">
                  <img
                    src={report.image_url || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80'}
                    alt={report.item_name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
                  <span className="absolute left-3 bottom-3 text-[11px] font-semibold text-white">
                    {report.type} item
                  </span>
                  <span className="absolute right-3 bottom-3 font-mono text-[10px] text-white/80">
                    {report.id}
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 flex-1 font-semibold text-base text-stone-900 line-clamp-1 group-hover:text-emerald-800 transition-colors">
                      {report.item_name}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        report.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {report.status === 'Resolved' ? 'Found' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-stone-500 line-clamp-2">{report.description}</p>
                  <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-[11px] text-stone-400">
                    <span>{new Date(report.date_reported).toLocaleDateString()}</span>
                    <span className="font-medium text-stone-600 group-hover:text-emerald-700">View details &rarr;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRepostReport(report);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-stone-700"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Repost
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (window.confirm(`Delete the report for "${report.item_name}"?`)) {
                          onDeleteReport(report);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 px-3 py-1.5 text-[11px] font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-500">No items reported yet under this account.</p>
        )}
      </div>

      {/* Compact email status for this user */}
      <div className="bg-white px-4 py-3 border border-stone-200 shadow-sm">
        <p className="flex items-center gap-2 text-xs text-stone-600">
          <Mail className="w-4 h-4 text-emerald-700" />
          {receivedLogs.length > 0
            ? 'The administrator has emailed you about your item.'
            : 'No administrator email has been sent about your items yet.'}
        </p>
      </div>
    </div>
  );
};
