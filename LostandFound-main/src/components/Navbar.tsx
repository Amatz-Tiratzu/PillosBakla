import React, { useState } from 'react';
import { User } from '../types';
import { LostBoxIcon } from './BrandIcons';
import { Shield, Menu, X, PlusCircle, LogOut } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentView: 'home' | 'lost' | 'found' | 'admin' | 'profile';
  onNavigate: (view: 'home' | 'lost' | 'found' | 'admin' | 'profile') => void;
  onOpenReportModal: (type: 'Lost' | 'Found') => void;
  onSignOut: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onOpenReportModal,
  onSignOut,
  onOpenLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#f8f9f0]/95 border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-[70px] flex items-center justify-between gap-4">
        
        {/* Brand Logo: Clean, refined & modern */}
        <div
          id="navbar-brand-logo"
          onClick={() => {
            onNavigate('home');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-10 h-10 rounded-md bg-white border border-stone-200 shadow-2xs flex items-center justify-center p-1 group-hover:shadow-xs transition-all">
            <LostBoxIcon className="w-8 h-8" />
          </div>

          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-[0.14em] text-stone-900 font-sans leading-none group-hover:text-stone-950 transition-colors">
              I FOUND
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 ml-auto">
          {/* Home */}
          <button
            id="nav-link-home"
            onClick={() => onNavigate('home')}
            className={`px-3 py-2 rounded-md text-base font-medium transition-all ${
              currentView === 'home'
                ? 'bg-[#1c1917] text-white rounded-lg shadow-sm'
                : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/50'
            }`}
          >
            Home
          </button>

          {/* Profile / My Uploads for regular users */}
          {currentUser?.role !== 'admin' && (
            <button
              id="nav-link-profile"
              onClick={() => onNavigate('profile')}
              className={`px-3 py-2 rounded-md text-base font-medium transition-all whitespace-nowrap ${
                currentView === 'profile'
                  ? 'bg-[#1c1917] text-white rounded-lg font-semibold shadow-sm'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/50'
              }`}
            >
              My Uploads
            </button>
          )}

          {/* Admin Control Center - Strictly Accessible to Administrators */}
          {currentUser?.role === 'admin' && (
            <button
              id="nav-link-admin"
              onClick={() => onNavigate('admin')}
              className={`px-3 py-2 rounded-md text-base font-medium flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'admin'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
              title="Administrator Control Center"
            >
              <Shield className="w-4 h-4 text-amber-500" />
              <span>Admin</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            </button>
          )}
        </nav>

        {/* User Account / Auth Actions */}
        <div className="hidden sm:flex items-center gap-1 ml-3">
          {currentUser ? (
            <div className="flex items-center gap-3 pl-2">
              <div 
                onClick={() => onNavigate('profile')}
                className="hidden cursor-pointer group"
                title={`Signed in as ${currentUser.name} (${currentUser.role})`}
              >
                <div className="w-7 h-7 rounded-full bg-stone-800 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs group-hover:ring-2 group-hover:ring-stone-400/40 transition-all">
                  {getInitials(currentUser.name)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-semibold text-stone-900 leading-tight group-hover:text-emerald-800 transition-colors">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] text-stone-500 font-medium">
                    {currentUser.role === 'admin' ? 'Admin Officer' : 'Campus User'}
                  </span>
                </div>
              </div>

              <button
                id="btn-sign-out"
                onClick={onSignOut}
                className="px-5 py-2 rounded-md text-base font-medium text-stone-800 bg-[#f1f1f1] hover:bg-white hover:text-stone-950 border border-stone-400 shadow-2xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-4 h-4 text-stone-500" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              id="btn-sign-in"
              onClick={onOpenLogin}
              className="px-6 py-2.5 rounded-full text-base font-medium text-white bg-stone-900 hover:bg-stone-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/70 border border-stone-200 text-stone-700 hover:text-stone-950 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200/60 bg-white/95 backdrop-blur-xl px-6 py-5 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors ${
                currentView === 'home' ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-800'
              }`}
            >
              Home
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-left flex items-center gap-2 transition-colors ${
                  currentView === 'admin' ? 'bg-stone-900 text-white' : 'bg-amber-50 text-amber-950 border border-amber-200'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Admin Center</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenReportModal('Lost');
                setMobileMenuOpen(false);
              }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-left bg-rose-50 text-rose-800 hover:bg-rose-100/70 flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Report Lost</span>
            </button>

            <button
              onClick={() => {
                onOpenReportModal('Found');
                setMobileMenuOpen(false);
              }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-left bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Report Found</span>
            </button>
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            {currentUser ? (
              <div className="flex items-center justify-between w-full">
                <div 
                  onClick={() => {
                    onNavigate('profile');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
                    {getInitials(currentUser.name)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-900">{currentUser.name}</p>
                    <p className="text-[10px] text-stone-500">{currentUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-stone-900"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
