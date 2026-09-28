import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { Lock, User, ArrowRight, Globe, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, authError } = useAuth();
  const { t, lang, toggleLanguage } = useTranslation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Default to Remember Me for authorized staff convenience
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setLocalError(t('login.errorUsernameRequired'));
      return;
    }
    if (!password.trim()) {
      setLocalError(t('login.errorPasswordRequired'));
      return;
    }

    setLocalError('');
    setLoading(true);
    const result = await login(username, password, rememberMe);
    setLoading(false);
    if (!result.success) {
      if (result.error === 'Invalid credentials. User does not exist.') {
        setLocalError(t('login.errorUserNotFound'));
      } else if (result.error === 'Incorrect password. Please verify and try again.') {
        setLocalError(t('login.errorInvalidPassword'));
      } else if (result.error === 'Please enter your username.') {
        setLocalError(t('login.errorUsernameRequired'));
      } else if (result.error === 'Please enter your password.') {
        setLocalError(t('login.errorPasswordRequired'));
      } else {
        setLocalError(result.error);
      }
    }
  };

  const getErrorMessage = () => {
    const err = localError || authError;
    if (!err) return null;
    if (err === 'Invalid credentials. User does not exist.') {
      return t('login.errorUserNotFound');
    }
    if (err === 'Incorrect password. Please verify and try again.') {
      return t('login.errorInvalidPassword');
    }
    if (err === 'Please enter your username.') {
      return t('login.errorUsernameRequired');
    }
    if (err === 'Please enter your password.') {
      return t('login.errorPasswordRequired');
    }
    return err;
  };

  return (
    <div className="min-h-screen bg-[#141110] text-[#ede8e3] flex flex-col justify-between p-4 selection:bg-[#c27a66]/30">
      
      {/* Top Bar with Language Toggle */}
      <div className="max-w-md w-full mx-auto flex justify-end pt-4">
        <button
          onClick={toggleLanguage}
          className="px-3 py-1.5 rounded-lg border border-[#332e2b] bg-[#1e1b19] text-xs text-[#8f8580] hover:text-[#ede8e3] flex items-center gap-1.5 transition shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-[#6b94b8]" />
          <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-block relative">
            <img
              src="/logo.jpg"
              alt={t('login.logoAlt')}
              className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-[#c27a66] shadow-xl"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-[#1e1b19] border border-[#332e2b] rounded-full p-1 text-sm shadow">
              🐾
            </div>
          </div>
          
          <h1 className="text-2xl font-black tracking-tight text-[#ede8e3]">
            {t('app.title')}
          </h1>
          <p className="text-xs text-[#c27a66] font-semibold tracking-wide uppercase">
            {t('login.portalTagline')}
          </p>
          <p className="text-xs text-[#8f8580]">
            {t('login.portalBadge')}
          </p>
        </div>

        {/* Secure Standard Login Form */}
        <div className="bg-[#1e1b19] border border-[#332e2b] rounded-2xl p-6 shadow-2xl space-y-5">
          
          <div className="border-b border-[#332e2b] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#ede8e3]">
                {t('login.title')}
              </h2>
              <p className="text-xs text-[#8f8580]">
                {t('login.subtitle')}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#6b94b8]/15 border border-[#6b94b8]/30 flex items-center justify-center text-[#6b94b8]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {getErrorMessage() && (
            <div className="p-3 rounded-xl bg-[#b55e5e]/15 border border-[#b55e5e]/30 text-xs text-[#e08989] flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <span>{getErrorMessage()}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-[#b5aea8] mb-1.5">
                {t('login.usernameLabel')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8f8580] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('login.usernamePlaceholder')}
                  className="w-full bg-[#141110] border border-[#332e2b] rounded-xl pl-9 pr-3 py-2 text-xs text-[#ede8e3] focus:outline-none focus:border-[#6b94b8] transition placeholder:text-[#5c544e]"
                />
              </div>
            </div>

            {/* Password Input (Visually Masked with Eye Toggle) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#b5aea8]">
                  {t('login.passwordLabel')}
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8f8580] absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  className="w-full bg-[#141110] border border-[#332e2b] rounded-xl pl-9 pr-10 py-2 text-xs text-[#ede8e3] focus:outline-none focus:border-[#6b94b8] transition placeholder:text-[#5c544e]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#8f8580] hover:text-[#ede8e3] transition focus:outline-none"
                  title={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox (30-day session persistence) */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-[#b5aea8] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#141110] border-[#332e2b] text-[#6b94b8] focus:ring-0 focus:ring-offset-0 accent-[#6b94b8] cursor-pointer"
                />
                <span>
                  {t('login.rememberMe')}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#8f5c48] hover:bg-[#a86b56] text-white shadow-lg transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{loading ? t('login.authenticating') : t('login.signIn')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* System Security Notice */}
          <div className="pt-3 border-t border-[#332e2b]/80 text-center">
            <p className="text-[11px] text-[#8f8580] leading-relaxed">
              {t('login.securityNotice')}
              <br />
              {t('login.defaultAccounts', { admin: 'Rashmi', worker: 'Nikhil' })}
            </p>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-[#8f8580] pb-2">
        {t('login.footer')}
      </footer>

    </div>
  );
}
