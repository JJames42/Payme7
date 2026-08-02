import React, { useState, useEffect } from 'react';
import { Sliders, Settings, Globe, MessageSquare, Mail, Webhook, CheckCircle2, Shield, Zap, RefreshCw } from 'lucide-react';

interface AdminIntegrationsViewProps {
  activeNav: string;
}

const getIconComponent = (name?: string) => {
  switch (name) {
    case 'Globe': return Globe;
    case 'MessageSquare': return MessageSquare;
    case 'Mail': return Mail;
    case 'Webhook': return Webhook;
    case 'Sliders': return Sliders;
    case 'Settings': return Settings;
    case 'Zap': return Zap;
    default: return Globe;
  }
};

export const AdminIntegrationsView: React.FC<AdminIntegrationsViewProps> = ({ activeNav }) => {
  const isChannelSettings = activeNav === 'Channel Settings';

  const [integrations, setIntegrations] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('payme_admin_integrations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'int-1', name: 'PayMe Web Chat Widget', category: 'Live Chat', status: 'Connected', desc: 'Embedded website support widget with real-time WebSocket messaging and file uploads.', iconName: 'Globe', enabled: true },
      { id: 'int-2', name: 'WhatsApp Business API', category: 'Messaging', status: 'Connected', desc: 'Direct WhatsApp integration for merchant alerts and automated clearance notifications.', iconName: 'MessageSquare', enabled: true },
      { id: 'int-3', name: 'WeChat Official Account & Mini Program', category: 'Social Commerce', status: 'Connected', desc: 'Syncs customer inquiries from WeChat Mini Program directly to the admin queue.', iconName: 'MessageSquare', enabled: true },
      { id: 'int-4', name: 'Facebook Messenger', category: 'Social Messaging', status: 'Connected', desc: 'Direct integration with Facebook Messenger page support inbox.', iconName: 'MessageSquare', enabled: true },
      { id: 'int-5', name: 'Salesforce CRM Integration', category: 'Enterprise CRM', status: 'Connected', desc: 'Bi-directional case sync with Salesforce Cloud.', iconName: 'Sliders', enabled: false },
      { id: 'int-6', name: 'Zendesk Service Desk', category: 'Help Desk', status: 'Connected', desc: 'Syncs tickets and notes with Zendesk support pipelines.', iconName: 'Settings', enabled: false },
      { id: 'int-7', name: 'HubSpot Marketing & Support', category: 'Marketing Automation', status: 'Connected', desc: 'Syncs contact timelines and support interactions.', iconName: 'Zap', enabled: false },
      { id: 'int-8', name: 'Email Support Gateway', category: 'Asynchronous', status: 'Active', desc: 'IMAP/SMTP sync for support@payme.hsbc.com.hk with automated ticket conversion.', iconName: 'Mail', enabled: true },
      { id: 'int-9', name: 'HSBC Core Banking Risk Webhooks', category: 'Security & AML', status: 'Live Sync', desc: 'Receives instant hold notifications and AML audit clearance callbacks.', iconName: 'Webhook', enabled: true },
    ];
  });

  const [channelConfig, setChannelConfig] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('payme_admin_channel_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      autoAssign: true,
      maxCaseload: '6',
      welcomeMessageEn: 'Welcome to PayMe Business Support! How can our specialists assist you today?',
      welcomeMessageHk: '歡迎使用 PayMe Business 商業支援服務！請問我們的專員可以如何協助您？',
      offlineMessage: 'Our specialists are currently offline. We will respond via email within 2 business hours.',
      csatSurveyEnabled: true,
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('payme_admin_integrations', JSON.stringify(integrations)); } catch {}
  }, [integrations]);

  const handleSaveChannelSettings = () => {
    try {
      localStorage.setItem('payme_admin_channel_config', JSON.stringify(channelConfig));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {}
  };

  const toggleIntegration = (id: string) => {
    setIntegrations((prev: any[]) => prev.map((item: any) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              {isChannelSettings ? <Settings className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {isChannelSettings ? 'Support Channel Configuration & Routing Rules' : 'Connected Integrations & API Webhooks'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {isChannelSettings
              ? 'Configure routing parameters, automated greeting messages, and customer survey rules.'
              : 'Manage live communication gateways, webhook endpoints, and third-party enterprise services.'}
          </p>
        </div>

        <button 
          onClick={() => {
            try { localStorage.setItem('payme_admin_integrations', JSON.stringify(integrations)); } catch {}
          }}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Content */}
      {isChannelSettings ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Automated Routing & Caseload Limits</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">Automatic Case Assignment</label>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Route incoming customer inquiries to available agents automatically</span>
                <input
                  type="checkbox"
                  checked={channelConfig.autoAssign}
                  onChange={(e) => setChannelConfig({ ...channelConfig, autoAssign: e.target.checked })}
                  className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">Max Concurrent Caseload per Agent</label>
              <select
                value={channelConfig.maxCaseload}
                onChange={(e) => setChannelConfig({ ...channelConfig, maxCaseload: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-500 transition-all cursor-pointer"
              >
                <option value="4">4 Concurrent Cases</option>
                <option value="6">6 Concurrent Cases (Recommended)</option>
                <option value="8">8 Concurrent Cases</option>
                <option value="10">10 Concurrent Cases</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="font-bold text-slate-700 block">English Welcome Message (en)</label>
              <textarea
                rows={2}
                value={channelConfig.welcomeMessageEn}
                onChange={(e) => setChannelConfig({ ...channelConfig, welcomeMessageEn: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-rose-500 transition-all resize-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="font-bold text-slate-700 block">Traditional Chinese Welcome Message (hk)</label>
              <textarea
                rows={2}
                value={channelConfig.welcomeMessageHk}
                onChange={(e) => setChannelConfig({ ...channelConfig, welcomeMessageHk: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-rose-500 transition-all resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveChannelSettings}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved Successfully!</span>
                </>
              ) : (
                <span>Save Channel Settings</span>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((int: any) => {
            const Icon = getIconComponent(int.iconName || int.icon);
            return (
              <div key={int.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{int.name}</h4>
                        <span className="text-[11px] text-slate-400 font-medium">{int.category}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${int.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{int.enabled ? int.status : 'Disconnected'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{int.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold">SSL Encryption • TLS 1.3 Active</span>
                  <button
                    onClick={() => toggleIntegration(int.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      int.enabled ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600' : 'bg-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    {int.enabled ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
