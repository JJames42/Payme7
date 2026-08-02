import React, { useState } from 'react';
import { ShieldCheck, Building2, Clock, MessageSquare, Lock, Key, Monitor, FileText, CheckCircle2, AlertTriangle, RefreshCw, Save, Sparkles } from 'lucide-react';

export const AdminGeneralSettingsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'hours' | 'messages' | 'security' | '2fa' | 'sessions' | 'audit'>('profile');

  // Form states
  const [profile, setProfile] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('payme_admin_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      businessName: 'PayMe Business LLC',
      legalEntity: 'HSBC PayMe Hong Kong Operations Ltd',
      merchantId: 'MCH-88992233',
      taxId: 'HK-BR-55443322',
      supportEmail: 'support@payme.hsbc.com.hk',
      supportPhone: '+852 2233 3000',
      address: 'HSBC Main Building, 1 Queen\'s Road Central, Hong Kong',
      timezone: 'Asia/Hong_Kong (UTC+8)',
    };
  });

  const [hours, setHours] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('payme_admin_hours');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: true,
      weekdays: '09:00 - 18:00',
      weekends: '10:00 - 16:00',
      afterHoursMode: 'Automated Bot + Email Ticket Conversion',
    };
  });

  const [messages, setMessages] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('payme_admin_messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      greeting: 'Hello! You are connected to secure PayMe Business Support.',
      waitQueue: 'All specialists are assisting other merchants. Your position in queue is being tracked.',
      inactivityTimeout: 'We haven\'t heard from you in a while. Would you like to keep this chat open?',
    };
  });

  const [security, setSecurity] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('payme_admin_security');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      ipWhiteList: '185.220.0.0/16, 210.3.0.0/16',
      sessionTimeoutMin: '30',
      allowFileUploads: true,
      requireSsl: true,
    };
  });

  const [twoFactor, setTwoFactor] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('payme_admin_2fa');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: true,
      enforceForSupervisors: true,
      authMethod: 'Google Authenticator / Authy (TOTP)',
    };
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('payme_admin_profile', JSON.stringify(profile));
      localStorage.setItem('payme_admin_hours', JSON.stringify(hours));
      localStorage.setItem('payme_admin_messages', JSON.stringify(messages));
      localStorage.setItem('payme_admin_security', JSON.stringify(security));
      localStorage.setItem('payme_admin_2fa', JSON.stringify(twoFactor));
    } catch {}
  }, [profile, hours, messages, security, twoFactor]);

  const [sessions] = useState([
    { id: 'sess-1', user: 'Carmen Lee (Supervisor)', ip: '210.3.12.88', browser: 'Chrome 126 on macOS', loginTime: 'Today at 09:15 AM', active: true },
    { id: 'sess-2', user: 'Alex Wong (Agent)', ip: '112.119.24.18', browser: 'Safari 17 on iOS', loginTime: 'Today at 10:02 AM', active: true },
    { id: 'sess-3', user: 'David Chen (Agent)', ip: '58.152.10.4', browser: 'Firefox 125 on Windows 11', loginTime: 'Yesterday at 18:45 PM', active: false },
  ]);

  const [auditLogs] = useState([
    { id: 'log-101', timestamp: '2026-07-26 13:45:22', user: 'Carmen Lee', action: 'RESOLVED_CASE', target: 'Case #C-20240517-0012', ip: '210.3.12.88' },
    { id: 'log-102', timestamp: '2026-07-26 12:10:05', user: 'Admin System', action: 'UPDATED_SECURITY_RULES', target: 'Firewall Policy #4', ip: 'System Local' },
    { id: 'log-103', timestamp: '2026-07-26 11:30:18', user: 'Alex Wong', action: 'LOCKED_CUSTOMER_INPUT', target: 'Case #C-20240517-0088', ip: '112.119.24.18' },
    { id: 'log-104', timestamp: '2026-07-26 09:15:00', user: 'Carmen Lee', action: 'USER_LOGIN_2FA_SUCCESS', target: 'Admin Portal', ip: '210.3.12.88' },
    { id: 'log-105', timestamp: '2026-07-25 17:22:41', user: 'David Chen', action: 'RELEASED_RISK_HOLD', target: 'Transaction #TX-998811', ip: '58.152.10.4' },
  ]);

  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('payme_admin_profile', JSON.stringify(profile));
      localStorage.setItem('payme_admin_hours', JSON.stringify(hours));
      localStorage.setItem('payme_admin_messages', JSON.stringify(messages));
      localStorage.setItem('payme_admin_security', JSON.stringify(security));
      localStorage.setItem('payme_admin_2fa', JSON.stringify(twoFactor));
    } catch {}
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const subTabs = [
    { id: 'profile', label: 'Business Profile', icon: Building2 },
    { id: 'hours', label: 'Operating Hours', icon: Clock },
    { id: 'messages', label: 'Automated Messages', icon: MessageSquare },
    { id: 'security', label: 'Security & Permissions', icon: Lock },
    { id: '2fa', label: 'Two-Factor Auth (2FA)', icon: Key },
    { id: 'sessions', label: 'Session Management', icon: Monitor },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
  ] as const;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">General System Settings Suite</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Configure enterprise security policies, 2FA authentication, operating schedules, and inspect audit logs.
          </p>
        </div>

        {savedMessage && (
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2 shadow-2xs flex flex-wrap items-center gap-1">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab Content */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
        {activeSubTab === 'profile' && (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Business Profile & Legal Entity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Business Display Name</label>
                <input
                  type="text"
                  value={profile.businessName}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 font-semibold text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Legal Entity Name</label>
                <input
                  type="text"
                  value={profile.legalEntity}
                  onChange={(e) => setProfile({ ...profile, legalEntity: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 font-semibold text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Merchant ID (MID)</label>
                <input
                  type="text"
                  value={profile.merchantId || ''}
                  onChange={(e) => setProfile({ ...profile, merchantId: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 font-semibold text-slate-800 transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Tax Registration Number (BRN)</label>
                <input
                  type="text"
                  value={profile.taxId || ''}
                  onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 font-semibold text-slate-800 transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Support Email Address</label>
                <input
                  type="email"
                  value={profile.supportEmail}
                  onChange={(e) => setProfile({ ...profile, supportEmail: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 font-semibold text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Support Phone Number</label>
                <input
                  type="text"
                  value={profile.supportPhone}
                  onChange={(e) => setProfile({ ...profile, supportPhone: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 font-semibold text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-slate-700 block">Headquarters Corporate Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 font-semibold text-slate-800 transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button type="submit" className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs">
                <Save className="w-4 h-4" />
                <span>Save Profile Settings</span>
              </button>
            </div>
          </form>
        )}

        {activeSubTab === 'hours' && (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Operating Hours & Schedule Routing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Weekday Schedule (Mon - Fri)</label>
                <input
                  type="text"
                  value={hours.weekdays}
                  onChange={(e) => setHours({ ...hours, weekdays: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 font-semibold text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Weekend Schedule (Sat - Sun)</label>
                <input
                  type="text"
                  value={hours.weekends}
                  onChange={(e) => setHours({ ...hours, weekends: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 font-semibold text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-slate-700 block">After-Hours Routing Behavior</label>
                <select
                  value={hours.afterHoursMode}
                  onChange={(e) => setHours({ ...hours, afterHoursMode: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-500 transition-all"
                >
                  <option value="Automated Bot + Email Ticket Conversion">Automated Bot + Email Ticket Conversion</option>
                  <option value="Strict Offline Message Only">Strict Offline Message Only</option>
                  <option value="24/7 AI Clearance Bot">24/7 AI Clearance Bot</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button type="submit" className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs">
                <Save className="w-4 h-4" />
                <span>Save Schedule</span>
              </button>
            </div>
          </form>
        )}

        {activeSubTab === 'messages' && (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Automated System Messages</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Standard Welcome Greeting</label>
                <textarea
                  rows={2}
                  value={messages.greeting}
                  onChange={(e) => setMessages({ ...messages, greeting: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:bg-white focus:border-rose-500 transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Queue Waiting Notice</label>
                <textarea
                  rows={2}
                  value={messages.waitQueue}
                  onChange={(e) => setMessages({ ...messages, waitQueue: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:bg-white focus:border-rose-500 transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Inactivity Timeout Warning</label>
                <textarea
                  rows={2}
                  value={messages.inactivityTimeout}
                  onChange={(e) => setMessages({ ...messages, inactivityTimeout: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:bg-white focus:border-rose-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button type="submit" className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs">
                <Save className="w-4 h-4" />
                <span>Save Messages</span>
              </button>
            </div>
          </form>
        )}

        {activeSubTab === 'security' && (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Security & Firewall Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-slate-700 block">Whitelisted Enterprise Subnets (CIDR)</label>
                <input
                  type="text"
                  value={security.ipWhiteList}
                  onChange={(e) => setSecurity({ ...security, ipWhiteList: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-semibold text-slate-800 outline-none focus:bg-white focus:border-rose-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Admin Session Timeout (Minutes)</label>
                <input
                  type="number"
                  value={security.sessionTimeoutMin}
                  onChange={(e) => setSecurity({ ...security, sessionTimeoutMin: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Transport Encryption</label>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>TLS 1.3 Strict Mode Active</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button type="submit" className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs">
                <Save className="w-4 h-4" />
                <span>Save Security Policy</span>
              </button>
            </div>
          </form>
        )}

        {activeSubTab === '2fa' && (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Two-Factor Authentication (2FA)</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900 text-sm">Require 2FA for All Admin Logins</div>
                  <div className="text-slate-500 font-medium">Enforces time-based OTP upon authentication for all staff.</div>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactor.enabled}
                  onChange={(e) => setTwoFactor({ ...twoFactor, enabled: e.target.checked })}
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900 text-sm">Enforce Hardware Security Keys for Supervisors</div>
                  <div className="text-slate-500 font-medium">Requires FIDO2 / WebAuthn token for financial clearance actions.</div>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactor.enforceForSupervisors}
                  onChange={(e) => setTwoFactor({ ...twoFactor, enforceForSupervisors: e.target.checked })}
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Primary Authenticator Provider</label>
                <select
                  value={twoFactor.authMethod}
                  onChange={(e) => setTwoFactor({ ...twoFactor, authMethod: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-500 transition-all"
                >
                  <option value="Google Authenticator / Authy (TOTP)">Google Authenticator / Authy (TOTP)</option>
                  <option value="HSBC Employee Security Token (FIDO2)">HSBC Employee Security Token (FIDO2)</option>
                  <option value="SMS Verification + Authy">SMS Verification + Authy</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button type="submit" className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs">
                <Save className="w-4 h-4" />
                <span>Update 2FA Policy</span>
              </button>
            </div>
          </form>
        )}

        {activeSubTab === 'sessions' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Active Admin Staff Sessions</h3>
              <button className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold transition-colors cursor-pointer">
                Revoke All Other Sessions
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {sessions.map((sess) => (
                <div key={sess.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{sess.user}</span>
                      {sess.active && <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Current Session</span>}
                    </div>
                    <div className="text-slate-500 font-medium flex items-center gap-2">
                      <span>IP: <strong className="font-mono text-slate-800">{sess.ip}</strong></span>
                      <span>•</span>
                      <span>{sess.browser}</span>
                      <span>•</span>
                      <span>Logged in: {sess.loginTime}</span>
                    </div>
                  </div>

                  {!sess.active && (
                    <button className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl font-bold transition-colors cursor-pointer">
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'audit' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">System Compliance & Action Audit Logs</h3>
              <span className="font-mono text-[11px] text-slate-400 font-bold">Showing latest 5 entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/50">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3">Target Reference</th>
                    <th className="p-3 pr-4">Origin IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-slate-500">{log.timestamp}</td>
                      <td className="p-3 font-bold text-slate-800 font-sans">{log.user}</td>
                      <td className="p-3 font-bold text-rose-600">{log.action}</td>
                      <td className="p-3 text-slate-700 font-sans font-semibold">{log.target}</td>
                      <td className="p-3 pr-4 text-slate-600">{log.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
