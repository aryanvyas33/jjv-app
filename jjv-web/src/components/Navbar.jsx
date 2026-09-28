import React from 'react';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { Shield, User, Smartphone, Globe, LogOut, Key } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, openMobileSimulator, openSettings }) {
  const { t, lang, toggleLanguage } = useTranslation();
  const { currentUser, isAdmin, logout } = useAuth();

  return (
    <header className="border-b border-border bg-card px-4 md:px-8 py-3 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <img
            src="/logo.jpg"
            alt="Jeev Jantu Vihar Logo"
            className="w-10 h-10 rounded-full object-cover border border-[#c27a66]/40 shadow"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg tracking-tight text-foreground flex items-center gap-1.5">
                {t('app.title')} <span className="text-xs text-muted font-normal">(जीव जंतु विहार)</span>
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#c27a66]/15 text-[#c27a66] font-medium border border-[#c27a66]/30">
                {t('app.location')}
              </span>
            </div>
            <p className="text-xs text-muted">{t('app.subtitle')}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-[#6b94b8] text-white shadow'
                : 'text-muted hover:text-foreground hover:bg-[#262220]'
            }`}
          >
            📊 {t('nav.dashboard')}
          </button>

          <button
            onClick={() => setActiveTab('dogs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dogs'
                ? 'bg-[#6b94b8] text-white shadow'
                : 'text-muted hover:text-foreground hover:bg-[#262220]'
            }`}
          >
            🐕 {t('nav.dogs')}
          </button>

          <button
            onClick={() => setActiveTab('cows')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'cows'
                ? 'bg-[#6b94b8] text-white shadow'
                : 'text-muted hover:text-foreground hover:bg-[#262220]'
            }`}
          >
            🐄 {t('nav.cows')}
          </button>

          <button
            onClick={openMobileSimulator}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap bg-gradient-to-r from-[#4a7194] to-[#8f5c48] text-white hover:opacity-90 shadow flex items-center gap-1.5 ml-1"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t('nav.mobileView')}</span>
          </button>
        </div>

        {/* Right Tools: Language Toggle & User Switcher */}
        <div className="flex items-center space-x-3 self-end md:self-center">
          
          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground hover:bg-[#262220] flex items-center gap-1.5 transition"
            title="Switch Language / भाषा बदलें"
          >
            <Globe className="w-3.5 h-3.5 text-[#6b94b8]" />
            <span className="font-medium">{lang === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-3 pl-3 border-l border-border">
            <div className="flex items-center space-x-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                isAdmin ? 'bg-[#c27a66]/20 text-[#c27a66] border border-[#c27a66]/40' : 'bg-[#6b94b8]/20 text-[#6b94b8] border border-[#6b94b8]/40'
              }`}>
                {isAdmin ? '👑' : '📱'}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground leading-tight">{currentUser.name}</p>
                <span className={`text-[10px] font-semibold ${isAdmin ? 'text-[#c27a66]' : 'text-[#6b94b8]'}`}>
                  {isAdmin ? 'Host / Admin' : 'Staff Member'}
                </span>
              </div>
            </div>

            <button
              onClick={openSettings}
              className="p-1.5 rounded-lg border border-border text-muted hover:text-foreground hover:bg-[#262220] transition flex items-center gap-1 text-xs"
              title="Account Security & Password Settings / पासवर्ड सेटिंग्स"
            >
              <Key className="w-3.5 h-3.5 text-[#c9a355]" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg border border-border text-muted hover:text-[#b55e5e] hover:bg-[#b55e5e]/15 transition flex items-center gap-1 text-xs"
              title={t('nav.logout')}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
