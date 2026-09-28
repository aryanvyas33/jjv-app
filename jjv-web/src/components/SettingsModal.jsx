import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { X, Lock, Shield, User, Key, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const { currentUser, changePassword, isAdmin } = useAuth();
  const { t, lang } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [loading, setLoading] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!currentPassword) {
      setStatusMessage({ type: 'error', text: t('settings.errorCurrentRequired') });
      return;
    }
    if (newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: t('settings.errorMinLength') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: t('settings.errorMismatch') });
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setStatusMessage({
        type: 'success',
        text: t('settings.successMessage')
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || t('settings.errorMessage')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1e1b19] border border-[#332e2b] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-0">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#332e2b] flex items-center justify-between bg-[#141110]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6b94b8]/15 border border-[#6b94b8]/30 flex items-center justify-center text-[#6b94b8]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#ede8e3]">
                {t('settings.title')}
              </h3>
              <p className="text-[11px] text-[#8f8580]">
                {t('settings.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8f8580] hover:text-[#ede8e3] hover:bg-[#332e2b] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* User Account Info Card */}
          <div className="p-3.5 rounded-xl bg-[#141110] border border-[#332e2b] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                isAdmin
                  ? 'bg-[#c27a66]/20 text-[#c27a66] border border-[#c27a66]/40'
                  : 'bg-[#6b94b8]/20 text-[#6b94b8] border border-[#6b94b8]/40'
              }`}>
                {isAdmin ? '👑' : '📱'}
              </div>
              <div>
                <p className="text-xs font-bold text-[#ede8e3]">{currentUser.name}</p>
                <p className="text-[11px] text-[#8f8580]">
                  {t('settings.usernameLabel')}{' '}
                  <span className="font-mono text-[#c9a355] font-semibold">{currentUser.username}</span>
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isAdmin ? 'bg-[#c27a66]/20 text-[#c27a66]' : 'bg-[#6b94b8]/20 text-[#6b94b8]'
            }`}>
              {isAdmin ? t('settings.adminRole') : t('settings.staffRole')}
            </span>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-tight">{statusMessage.text}</span>
            </div>
          )}

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            <div className="border-b border-[#332e2b] pb-2">
              <h4 className="text-xs font-bold text-[#c27a66] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>{t('settings.changePassword')}</span>
              </h4>
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-xs font-medium text-[#b5aea8] mb-1">
                {t('settings.currentPassword')}
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('settings.currentPasswordPlaceholder')}
                  className="w-full bg-[#141110] border border-[#332e2b] rounded-xl px-3 py-2 pr-9 text-xs text-[#ede8e3] focus:outline-none focus:border-[#6b94b8] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-[#8f8580] hover:text-[#ede8e3]"
                >
                  {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-medium text-[#b5aea8] mb-1">
                {t('settings.newPassword')}
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settings.newPasswordPlaceholder')}
                  className="w-full bg-[#141110] border border-[#332e2b] rounded-xl px-3 py-2 pr-9 text-xs text-[#ede8e3] focus:outline-none focus:border-[#6b94b8] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-[#8f8580] hover:text-[#ede8e3]"
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-medium text-[#b5aea8] mb-1">
                {t('settings.confirmPassword')}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('settings.confirmPasswordPlaceholder')}
                className="w-full bg-[#141110] border border-[#332e2b] rounded-xl px-3 py-2 text-xs text-[#ede8e3] focus:outline-none focus:border-[#6b94b8] transition"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#262220] hover:bg-[#332e2b] text-[#8f8580] hover:text-[#ede8e3] border border-[#332e2b] transition"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#6b94b8] hover:bg-[#5a82a6] text-white shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{loading ? t('settings.saving') : t('settings.updatePassword')}</span>
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}
