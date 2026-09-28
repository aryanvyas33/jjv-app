import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Home, ChevronDown, ChevronUp, Copy, Check, Terminal, Trash2 } from 'lucide-react';

/**
 * Reusable React Error Boundary Component for Jeev Jantu Vihar.
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a graceful fallback UI with recovery actions.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and log details
    this.setState({ errorInfo });
    console.error('[JJV ErrorBoundary caught an error]:', error, errorInfo);

    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (err) {
        console.error('[JJV ErrorBoundary onError callback failed]:', err);
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.handleReset();
    if (window.location.hash || window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  handleClearCache = () => {
    const isHi = (typeof localStorage !== 'undefined' && localStorage.getItem('jjv_language')) === 'hi';
    const confirmMsg = isHi
      ? 'क्या आप स्थानीय डेटा कैश साफ़ करके रीसेट करना चाहते हैं?'
      : 'Reset local application cache? This can resolve crashes caused by corrupted offline state.';
    if (window.confirm(confirmMsg)) {
      try {
        if (typeof localStorage !== 'undefined') {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('jjv_') || key.startsWith('supabase.'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        }
      } catch (err) {
        console.error('Failed clearing cache:', err);
      }
      window.location.reload();
    }
  };

  handleCopyDetails = () => {
    const { error, errorInfo } = this.state;
    const text = `=== Jeev Jantu Vihar Error Report ===\nTime: ${new Date().toISOString()}\nError: ${error?.toString() || 'Unknown error'}\nStack: ${error?.stack || 'No stack trace'}\nComponent Stack: ${errorInfo?.componentStack || 'No component stack'}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      }).catch(() => {
        // Fallback
      });
    }
  };

  render() {
    const { hasError, error, errorInfo, showDetails, copied } = this.state;
    const { children, fallback, scope = 'app', title, message } = this.props;

    if (hasError) {
      // Check if custom fallback render function or node was provided
      if (typeof fallback === 'function') {
        return fallback(error, this.handleReset);
      }
      if (fallback) {
        return fallback;
      }

      // Check language preference stored in local storage
      const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('jjv_language')) || 'en';
      const isHi = lang === 'hi';

      const defaultTitle = title || (isHi
        ? 'कुछ अप्रत्याशित त्रुटि हुई'
        : 'Something went wrong');

      const defaultMessage = message || (isHi
        ? 'सिस्टम में एक अप्रत्याशित समस्या आई है। आपका रिकॉर्ड डेटा सुरक्षित है। कृपया नीचे दिए गए विकल्पों से पुनः प्रयास करें।'
        : 'An unexpected application error occurred while rendering this view. Your animal records remain safe. Please use the recovery options below.');

      // Section-level fallback (compact for inside tabs/cards)
      if (scope === 'section') {
        return (
          <div className="my-6 p-6 rounded-2xl bg-[#1a1714] border border-[#b55e5e]/40 shadow-lg text-foreground">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#b55e5e]/15 border border-[#b55e5e]/30 text-[#b55e5e] shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-foreground">
                  {defaultTitle}
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  {defaultMessage}
                </p>
                {error && (
                  <p className="text-xs font-mono text-[#b55e5e] bg-[#141110] border border-border px-3 py-1.5 rounded-lg mt-3 truncate">
                    {error.message || error.toString()}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2.5 mt-4">
                  <button
                    type="button"
                    onClick={this.handleReset}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#6b94b8] hover:bg-[#5a83a7] text-white text-xs font-semibold transition shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isHi ? 'पुनः प्रयास करें' : 'Try Again'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={this.handleReload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#262220] hover:bg-[#322d2b] border border-border text-foreground text-xs font-medium transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isHi ? 'पेज रीलोड करें' : 'Reload Page'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => this.setState({ showDetails: !showDetails })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted hover:text-foreground transition ml-auto"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{showDetails ? (isHi ? 'विवरण छुपाएं' : 'Hide Stack') : (isHi ? 'तकनीकी विवरण' : 'Show Stack')}</span>
                    {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {showDetails && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                        {isHi ? 'तकनीकी त्रुटि ट्रेस' : 'Technical Error Trace'}
                      </span>
                      <button
                        type="button"
                        onClick={this.handleCopyDetails}
                        className="inline-flex items-center gap-1 text-[11px] text-[#6b94b8] hover:underline"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? (isHi ? 'कॉपी हो गया!' : 'Copied!') : (isHi ? 'कॉपी करें' : 'Copy log')}</span>
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-[#b5aea8] bg-[#141110] p-3 rounded-lg border border-border overflow-x-auto max-h-48 whitespace-pre-wrap">
                      {error?.stack || error?.toString()}
                      {errorInfo?.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Full Application Fallback
      return (
        <div className="min-h-screen bg-[#141110] text-foreground flex items-center justify-center p-4 selection:bg-[#c27a66] selection:text-white">
          <div className="max-w-xl w-full bg-[#1a1714] border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Header Icon & Title */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#b55e5e]/15 border border-[#b55e5e]/30 flex items-center justify-center text-[#b55e5e] shrink-0 shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    {defaultTitle}
                  </h1>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#b55e5e]/20 text-[#b55e5e] border border-[#b55e5e]/30">
                    Application Error
                  </span>
                </div>
                <p className="text-xs text-muted mt-1.5 leading-relaxed">
                  {defaultMessage}
                </p>
              </div>
            </div>

            {/* Error Message Snippet */}
            {error && (
              <div className="bg-[#141110] border border-border rounded-xl p-3.5 text-xs font-mono text-[#b55e5e] break-words">
                <span className="text-muted block text-[10px] uppercase tracking-wider mb-1 font-sans">
                  {isHi ? 'त्रुटि संदेश' : 'Error message'}:
                </span>
                {error.message || error.toString()}
              </div>
            )}

            {/* Recovery Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#6b94b8] hover:bg-[#5a83a7] text-white text-xs font-semibold shadow transition active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isHi ? 'पुनः प्रयास करें' : 'Try Again'}</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#262220] hover:bg-[#322d2b] border border-border text-foreground text-xs font-semibold transition active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isHi ? 'पेज रीलोड करें' : 'Reload Application'}</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-transparent hover:bg-[#262220] border border-transparent hover:border-border text-muted hover:text-foreground text-xs font-medium transition"
              >
                <Home className="w-4 h-4" />
                <span>{isHi ? 'होम' : 'Home'}</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCache}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-transparent hover:bg-[#b55e5e]/15 border border-transparent hover:border-[#b55e5e]/30 text-muted hover:text-[#b55e5e] text-xs font-medium transition"
                title={isHi ? 'स्थानीय कैश साफ़ करें' : 'Clear local cache'}
              >
                <Trash2 className="w-4 h-4" />
                <span>{isHi ? 'कैश साफ़ करें' : 'Clear Cache'}</span>
              </button>
            </div>

            {/* Collapsible Technical Details */}
            <div className="pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !showDetails })}
                  className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition py-1"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{showDetails ? (isHi ? 'तकनीकी विवरण छुपाएं' : 'Hide Technical Details') : (isHi ? 'तकनीकी विवरण देखें' : 'View Technical Details')}</span>
                  {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showDetails && (
                  <button
                    type="button"
                    onClick={this.handleCopyDetails}
                    className="inline-flex items-center gap-1.5 text-xs text-[#6b94b8] hover:text-[#8baecf] transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (isHi ? 'कॉपी हो गया!' : 'Copied!') : (isHi ? 'लॉग कॉपी करें' : 'Copy Stack Trace')}</span>
                  </button>
                )}
              </div>

              {showDetails && (
                <div className="mt-3">
                  <pre className="text-[11px] font-mono text-[#b5aea8] bg-[#141110] p-4 rounded-xl border border-border overflow-x-auto max-h-64 whitespace-pre-wrap leading-relaxed">
                    {error?.stack || error?.toString()}
                    {'\n\n--- Component Stack ---\n'}
                    {errorInfo?.componentStack || 'No component stack available.'}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="text-center text-[11px] text-muted pt-2 border-t border-border/40">
              <span>Jeev Jantu Vihar (जीव जंतु विहार) — Bhopal Animal Sanctuary</span>
            </div>

          </div>
        </div>
      );
    }

    return children;
  }
}
