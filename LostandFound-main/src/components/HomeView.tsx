import React, { useState } from 'react';
import { ItemReport } from '../types';
import { LostBoxIcon } from './BrandIcons';
import { Search, MapPin, Calendar, Tag } from 'lucide-react';

interface HomeViewProps {
  reports: ItemReport[];
  onOpenReportDetail: (report: ItemReport) => void;
  onOpenReportModal: (type: 'Lost' | 'Found') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  reports,
  onOpenReportDetail,
  onOpenReportModal,
}) => {
  const [filterType, setFilterType] = useState<'All' | 'Lost' | 'Found'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = reports.filter((item) => item.status !== 'Resolved').filter((item) => {
    const matchesType = filterType === 'All' || item.type === filterType;
    const matchesSearch =
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleOpenReportModal = (type: 'Lost' | 'Found') => {
    setFilterType(type);
    onOpenReportModal(type);
  };

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Section matching Screenshot 2026-09-11 143424.png */}
      <section className="relative pt-6 sm:pt-10 lg:pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Hero Text: Exact wording & styling from Screenshot */}
            <div className="lg:col-span-6 space-y-6">
              <h1 className="text-6xl sm:text-7xl lg:text-[82px] font-black tracking-tight text-[#1E1E1E] leading-[1.05] font-sans">
                Find &amp; <br />
                Recover <br />
                <span className="text-[#1E6124]">With</span>{' '}
                <span className="text-[#421A17]">Ease</span>
              </h1>

            </div>

            {/* Right Hero Action Column: Lost & Found buttons + 3-Photo Collage from Screenshot */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-end">
              <div className="w-full max-w-[420px] space-y-4">
                
                {/* Report actions */}
                <button
                  onClick={() => handleOpenReportModal('Lost')}
                  className="w-full min-h-[112px] px-7 sm:px-9 py-6 bg-[#b94b42] hover:bg-[#a94139] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 flex items-center justify-between cursor-pointer border border-[#963b34] active:scale-[0.99] group"
                >
                  <div className="text-left">
                    <span className="block text-2xl sm:text-3xl font-bold tracking-tight">Report lost item</span>
                  </div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <LostBoxIcon className="w-14 h-14 sm:w-18 sm:h-18" />
                  </div>
                </button>

                {/* Overlapping Three Images matching Screenshot 2026-09-11 143424.png */}
                <div className="relative w-full h-[220px] pt-4 select-none">
                  
                  {/* Photo 1 (Left / Back): Laptop with holographic search display */}
                  <div className="absolute left-0 bottom-2 w-52 sm:w-56 h-34 sm:h-38 rounded-xl overflow-hidden shadow-xl border border-stone-800/50 bg-stone-900 z-10 transform hover:scale-102 transition-transform">
                    <img
                      src="/src/assets/images/laptop_item.jpg"
                      alt="Laptop item report"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Photo 2 (Center / Overlap): Cardboard notice pinned to tree with 'LOST CAT' */}
                  <div className="absolute left-32 sm:left-36 top-1 w-40 sm:w-44 h-48 sm:h-52 rounded-xl overflow-hidden shadow-2xl border border-stone-800/60 bg-stone-900 z-20 transform hover:scale-102 transition-transform">
                    <img
                      src="/src/assets/images/id_card_item.jpg"
                      alt="ID card item report"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Photo 3 (Right / Bottom): Vintage brass compass resting on map */}
                  <div className="absolute right-0 bottom-1 w-48 sm:w-52 h-34 sm:h-38 rounded-xl overflow-hidden shadow-xl border border-stone-800/50 bg-stone-900 z-10 transform hover:scale-102 transition-transform">
                    <img
                      src="/src/assets/images/iphone_item.jpg"
                      alt="Phone item report"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Directory of Items */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="bg-white/90 border border-stone-200 shadow-sm p-5 sm:p-7 space-y-6">
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
            {/* Type Switcher */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
              {(['All', 'Lost', 'Found'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === type
                      ? type === 'Lost'
                        ? 'bg-[#b94b42] text-white shadow-xs'
                        : type === 'Found'
                        ? 'bg-[#3e884d] text-white shadow-xs'
                        : 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-stone-50 text-stone-900 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {filteredReports.map((item) => (
              <div
                key={item.id}
                id={`report-card-${item.id}`}
                onClick={() => onOpenReportDetail(item)}
                className="group bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Item Image with Refined Single Header Pill */}
                  <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=500&q=80'}
                      alt={item.item_name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />

                  </div>

                  {/* Card Content with Refined Typographic Balance */}
                  <div className="p-4 sm:p-5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium">
                        {new Date(item.date_reported).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-stone-950 group-hover:text-stone-800 transition-colors line-clamp-1 tracking-tight">
                      {item.item_name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate font-normal">{item.location}</span>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-normal pt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Card Footer with Reporter Identity & Action */}
                <div className="px-4 sm:px-5 py-3 border-t border-stone-100 bg-stone-50/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-stone-900 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      {item.reporter_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="text-stone-700 font-medium truncate text-xs">
                      {item.reporter_name}
                    </span>
                  </div>

                  <span className="text-stone-900 font-semibold text-xs group-hover:text-emerald-800 transition-colors flex items-center gap-0.5 shrink-0 ml-2">
                    <span>View</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12 text-stone-500">
              <p className="text-base font-medium">No reports found matching your filter criteria.</p>
              <button
                onClick={() => {
                  setFilterType('All');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs font-semibold text-emerald-700 hover:underline"
              >
                Clear search filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

