import React, { useState } from 'react';
import { User, ItemReport } from '../types';
import { X, PlusCircle, Loader2 } from 'lucide-react';

interface ReportItemModalProps {
  initialType: 'Lost' | 'Found';
  currentUser: User | null;
  initialReport?: ItemReport | null;
  onClose: () => void;
  onReportCreated: (newReport: ItemReport) => void;
}

export const ReportItemModal: React.FC<ReportItemModalProps> = ({
  initialType,
  currentUser,
  initialReport,
  onClose,
  onReportCreated,
}) => {
  const type: 'Lost' | 'Found' = initialReport?.type || initialType;
  const [itemName, setItemName] = useState(initialReport?.item_name || '');
  const [category, setCategory] = useState(initialReport?.category || 'Electronics');
  const [location, setLocation] = useState(initialReport?.location || '');
  const [itemDescription, setItemDescription] = useState(initialReport?.description || '');
  const [howLost, setHowLost] = useState('');
  const [imageUrl, setImageUrl] = useState(initialReport?.image_url || '');
  const [imageName, setImageName] = useState(initialReport?.image_url ? 'Current report image' : '');
  const [reporterName, setReporterName] = useState(initialReport?.reporter_name || currentUser?.name || '');
  const [reporterEmail, setReporterEmail] = useState(initialReport?.reporter_email || currentUser?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !location) {
      setError('Please fill in the item name and location.');
      return;
    }
    if (type === 'Lost' && !reporterEmail.trim()) {
      setError('Please provide your contact email so the admin can reach you.');
      return;
    }
    if (!imageUrl) {
      setError('Please upload an image of the item.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || 2,
          reporter_name: reporterName.trim() || currentUser?.name || 'Campus Reporter',
          reporter_email: reporterEmail.trim().toLowerCase(),
          item_name: itemName.trim(),
          category,
          type,
          location: location.trim(),
          description: [
            itemDescription.trim(),
            howLost.trim() ? `How it was lost: ${howLost.trim()}` : '',
          ]
            .filter(Boolean)
            .join('\n\n'),
          image_url: imageUrl.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create report.');
      }

      const created = await response.json();
      // Ensure reporter info is attached for display
      const fullReport: ItemReport = {
        ...created,
        reporter_name: reporterName.trim() || currentUser?.name || 'Campus Reporter',
        reporter_email: reporterEmail.trim().toLowerCase() || currentUser?.email || 'reporter@campus.edu',
      };

      onReportCreated(fullReport);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-stone-900">
              {initialReport ? 'Repost' : 'Submit a'} {type} Item Report
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-md border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Electronics">Electronics</option>
                <option value="Personal Accessories">Personal Accessories</option>
                <option value="Keys">Keys</option>
                <option value="Cards & ID">Cards &amp; ID</option>
                <option value="Clothing">Clothing</option>
                <option value="Documents">Documents</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {type === 'Lost' && (
          /* Reporter Contact Information (Required so admin can see email & directly contact) */
            <div className="p-4 rounded-md bg-stone-50/90 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                Reporter Contact Details *
              </label>
              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Direct Admin Reach
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Your Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                />
              </div>
            </div>
            <p className="text-[11px] text-stone-500 leading-snug">
              Administrators will see this email and use it to notify you directly via Gmail or official dispatch when matching items are found or resolved.
            </p>
          </div>
          )}

          {type === 'Lost' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  How was it lost?
                </label>
                <textarea
                  rows={3}
                  value={howLost}
                  onChange={(e) => setHowLost(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Describe the item
                </label>
                <textarea
                  rows={3}
                  required
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Message to Admin *
              </label>
              <textarea
                rows={4}
                required
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Item Image *
            </label>
            <input
              type="file"
              accept="image/*"
              required={!initialReport}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  return;
                }
                if (file.size > 7 * 1024 * 1024) {
                  setError('Please choose an image smaller than 7MB.');
                  e.currentTarget.value = '';
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  setImageUrl(String(reader.result));
                  setImageName(file.name);
                  setError(null);
                };
                reader.readAsDataURL(file);
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-md border border-stone-300 file:mr-3 file:rounded file:border-0 file:bg-stone-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {imageName && <p className="mt-1 text-[11px] text-stone-500">Selected: {imageName}</p>}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
              <span>Submit Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
