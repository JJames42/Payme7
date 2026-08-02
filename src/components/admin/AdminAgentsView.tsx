import React, { useState, useEffect } from 'react';
import { Agent, ChatSession } from '../../types';
import { UserCheck, Layers, Ban, Edit3, ShieldAlert, CheckCircle2, Star, Search, Trash2, ArrowUpRight, Plus, X } from 'lucide-react';

interface AdminAgentsViewProps {
  activeNav: string;
  agents: Agent[];
  chats: ChatSession[];
  onSelectChat: (chat: ChatSession) => void;
  onRefresh?: () => void | Promise<void>;
}

const DEFAULT_TEAMS = [
  { id: 'team-1', name: 'Risk & Clearance Team', members: 4, cases: 18, lead: 'Carmen Lee', desc: 'Handles AML checks, hold releases, and dispute resolutions.' },
  { id: 'team-2', name: 'Merchant VIP Support', members: 3, cases: 12, lead: 'Alex Wong', desc: 'Dedicated queue for high-volume enterprise merchants.' },
  { id: 'team-3', name: 'Technical Integration Squad', members: 3, cases: 9, lead: 'David Chen', desc: 'Assists with API webhooks, checkout SDKs, and payment gateway issues.' },
  { id: 'team-4', name: 'General Customer Care', members: 5, cases: 34, lead: 'Jessica Chan', desc: 'First-line support for account access and billing questions.' },
];

const DEFAULT_BANNED = [
  { id: 'ban-1', name: 'Spam Bot 404', email: 'spammer404@mailinator.com', ip: '185.220.101.5', reason: 'Automated flood scripts', date: '2026-07-24' },
  { id: 'ban-2', name: 'Abusive User', email: 'user8899@gmail.com', ip: '112.119.24.18', reason: 'Repeated harassment of support staff', date: '2026-07-20' },
];

export const AdminAgentsView: React.FC<AdminAgentsViewProps> = ({ activeNav, agents, chats, onSelectChat, onRefresh }) => {
  const isTeams = activeNav === 'Teams';
  const isBanList = activeNav === 'Ban List';
  const isInternalNotes = activeNav === 'Internal Notes';

  const [searchQuery, setSearchQuery] = useState('');

  const [teamsList, setTeamsList] = useState(() => {
    try {
      const saved = localStorage.getItem('payme_admin_teams');
      return saved ? JSON.parse(saved) : DEFAULT_TEAMS;
    } catch { return DEFAULT_TEAMS; }
  });

  const [bannedList, setBannedList] = useState(() => {
    try {
      const saved = localStorage.getItem('payme_admin_banned');
      return saved ? JSON.parse(saved) : DEFAULT_BANNED;
    } catch { return DEFAULT_BANNED; }
  });

  useEffect(() => {
    try { localStorage.setItem('payme_admin_teams', JSON.stringify(teamsList)); } catch {}
  }, [teamsList]);

  useEffect(() => {
    try { localStorage.setItem('payme_admin_banned', JSON.stringify(bannedList)); } catch {}
  }, [bannedList]);

  // Modal states
  const [showModal, setShowModal] = useState<'agent' | 'team' | 'ban' | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Agent form
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDepartment, setFormDepartment] = useState('Customer Operations');
  const [formEmail, setFormEmail] = useState('');

  // Team form
  const [formTeamName, setFormTeamName] = useState('');
  const [formMembers, setFormMembers] = useState('3');
  const [formLead, setFormLead] = useState('');
  const [formDesc, setFormDesc] = useState('');

  // Ban form
  const [formBanName, setFormBanName] = useState('');
  const [formBanEmail, setFormBanEmail] = useState('');
  const [formBanIp, setFormBanIp] = useState('');
  const [formBanReason, setFormBanReason] = useState('');

  const openModal = () => {
    if (isTeams) {
      setFormTeamName('');
      setFormMembers('3');
      setFormLead('');
      setFormDesc('');
      setShowModal('team');
    } else if (isBanList) {
      setFormBanName('');
      setFormBanEmail('');
      setFormBanIp('');
      setFormBanReason('');
      setShowModal('ban');
    } else if (!isInternalNotes) {
      setFormName('');
      setFormTitle('');
      setFormDepartment('Customer Operations');
      setFormEmail('');
      setShowModal('agent');
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showModal === 'agent') {
      if (!formName.trim()) return;
      setLoadingSubmit(true);
      try {
        await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            title: formTitle || 'Customer Support Specialist',
            department: formDepartment,
            email: formEmail
          })
        });
        if (onRefresh) await onRefresh();
      } catch (err) {
        console.error('Failed to create agent:', err);
      } finally {
        setLoadingSubmit(false);
        setShowModal(null);
      }
    } else if (showModal === 'team') {
      if (!formTeamName.trim()) return;
      const newTeam = {
        id: `team-${Date.now()}`,
        name: formTeamName,
        members: parseInt(formMembers) || 1,
        cases: 0,
        lead: formLead || 'Unassigned',
        desc: formDesc || 'Specialized support queue.'
      };
      setTeamsList((prev: any[]) => [newTeam, ...prev]);
      setShowModal(null);
    } else if (showModal === 'ban') {
      if (!formBanName.trim() && !formBanIp.trim()) return;
      const newBan = {
        id: `ban-${Date.now()}`,
        name: formBanName || 'Anonymous Restricted User',
        email: formBanEmail || 'no-reply@restricted.hk',
        ip: formBanIp || '192.168.1.100',
        reason: formBanReason || 'Security risk violation',
        date: new Date().toISOString().split('T')[0]
      };
      setBannedList((prev: any[]) => [newBan, ...prev]);
      setShowModal(null);
    }
  };

  // Extract all internal notes from chats
  const allNotes = React.useMemo(() => {
    const list: Array<{ id: string; chatId: string; userName: string; text: string; date: string; chat: ChatSession }> = [];
    chats.forEach((c) => {
      if (c.internalNotes && c.internalNotes.trim()) {
        list.push({
          id: `note-${c.id}`,
          chatId: c.caseId || c.id.substring(0, 8),
          userName: c.userName || 'Customer',
          text: c.internalNotes,
          date: new Date(c.createdAt).toLocaleDateString(),
          chat: c,
        });
      }
      c.messages.forEach((m) => {
        if (m.text.startsWith('Internal Note') || m.text.includes('Internal Note')) {
          list.push({
            id: m.id,
            chatId: c.caseId || c.id.substring(0, 8),
            userName: c.userName || 'Customer',
            text: m.text,
            date: new Date(m.timestamp).toLocaleDateString(),
            chat: c,
          });
        }
      });
    });
    return list;
  }, [chats]);

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              {isTeams ? <Layers className="w-4 h-4" /> : isBanList ? <Ban className="w-4 h-4" /> : isInternalNotes ? <Edit3 className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {isTeams ? 'Support Teams & Skill Groups' : isBanList ? 'Blocked Customers & Firewall Ban List' : isInternalNotes ? 'Cross-Case Internal Operations Notes' : 'Support Agents & Supervisor Roster'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {isTeams
              ? 'Organize specialists into functional queues with dedicated routing rules.'
              : isBanList
              ? 'Manage blocked IP addresses and locked user accounts to protect support operations.'
              : isInternalNotes
              ? 'Search and review operational notes left by supervisors and agents across all active cases.'
              : 'Monitor agent availability, live caseload distributions, and CSAT ratings.'}
          </p>
        </div>

        {!isInternalNotes && (
          <button onClick={openModal} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>{isTeams ? 'Create New Team' : isBanList ? 'Block IP / User' : 'Add New Agent'}</span>
          </button>
        )}
      </div>

      {/* Content Section */}
      {isBanList ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Restricted Profiles ({bannedList.length})</span>
          </div>
          <div className="divide-y divide-slate-100">
            {bannedList.map((item: any) => (
              <div key={item.id} className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-slate-900">{item.name}</span>
                    <span className="text-xs font-mono text-slate-500">({item.email})</span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium flex items-center gap-3">
                    <span>IP: <strong className="font-mono text-slate-900">{item.ip}</strong></span>
                    <span>•</span>
                    <span className="text-rose-600 font-semibold">Reason: {item.reason}</span>
                  </div>
                </div>

                <button
                  onClick={() => setBannedList((prev: any[]) => prev.filter((b) => b.id !== item.id))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Unblock</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : isInternalNotes ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search internal notes across all cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-rose-500 transition-all"
              />
            </div>
          </div>

          {allNotes.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Edit3 className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
              <div className="font-semibold text-slate-600 text-sm">No internal notes recorded</div>
              <div className="text-xs">Supervisors and agents have not recorded any internal notes on active cases yet.</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allNotes
                .filter((n) => !searchQuery || n.text.toLowerCase().includes(searchQuery.toLowerCase()) || n.userName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((note) => (
                  <div
                    key={note.id}
                    onClick={() => onSelectChat(note.chat)}
                    className="p-5 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">Case {note.chatId}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-xs text-slate-700">{note.userName}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-[10px] text-slate-400 font-medium">{note.date}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium bg-amber-50/60 p-3 rounded-xl border border-amber-200/50">
                        {note.text}
                      </p>
                    </div>

                    <button className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-colors shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : isTeams ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamsList.map((t: any, idx: number) => (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base text-slate-900">{t.name}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">{t.members} Members</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{t.desc}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Team Lead: <strong className="text-slate-900">{t.lead}</strong></span>
                <span className="text-emerald-600 font-bold">{t.cases} Active Cases</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase bg-slate-50/50">
                  <th className="p-4 pl-6">Agent Member</th>
                  <th className="p-4">Role & Title</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Active Caseload</th>
                  <th className="p-4 pr-6">CSAT Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {agent.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{agent.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">ID: {agent.id}</div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{agent.title || 'Support Specialist'}</td>
                    <td className="p-4 text-slate-600">{agent.department || 'Customer Operations'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${agent.status === 'online' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-slate-900">{agent.currentChatCount || 0}</td>
                    <td className="p-4 pr-6 font-bold text-slate-900">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{agent.rating ? agent.rating.toFixed(1) : '4.9'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {showModal === 'agent' ? 'Add New Support Agent' : showModal === 'team' ? 'Create New Skill Team' : 'Block IP Address or User'}
              </h3>
              <button type="button" onClick={() => setShowModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {showModal === 'agent' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g., Kevin Wong"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Role Title</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g., Senior Merchant Specialist"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                    <select
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500 bg-white"
                    >
                      <option value="Customer Operations">Customer Operations</option>
                      <option value="Risk & Compliance">Risk & Compliance</option>
                      <option value="Merchant Services">Merchant Services</option>
                      <option value="VIP Support">VIP Support</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g., kevin.wong@payme.hk"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </>
              )}

              {showModal === 'team' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Team Name</label>
                    <input
                      type="text"
                      required
                      value={formTeamName}
                      onChange={(e) => setFormTeamName(e.target.value)}
                      placeholder="e.g., Fraud Prevention Squad"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Initial Members</label>
                      <input
                        type="number"
                        min="1"
                        value={formMembers}
                        onChange={(e) => setFormMembers(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Team Lead</label>
                      <input
                        type="text"
                        value={formLead}
                        onChange={(e) => setFormLead(e.target.value)}
                        placeholder="e.g., Carmen Lee"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description & Scope</label>
                    <textarea
                      rows={3}
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Describe what type of tickets and inquiries this team handles..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>
                </>
              )}

              {showModal === 'ban' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">IP Address</label>
                    <input
                      type="text"
                      required
                      value={formBanIp}
                      onChange={(e) => setFormBanIp(e.target.value)}
                      placeholder="e.g., 185.220.101.99"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">User / Profile Name (Optional)</label>
                    <input
                      type="text"
                      value={formBanName}
                      onChange={(e) => setFormBanName(e.target.value)}
                      placeholder="e.g., Spammer Bot"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={formBanEmail}
                      onChange={(e) => setFormBanEmail(e.target.value)}
                      placeholder="e.g., spammer@mail.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Restriction</label>
                    <input
                      type="text"
                      required
                      value={formBanReason}
                      onChange={(e) => setFormBanReason(e.target.value)}
                      placeholder="e.g., Automated flood attacks / Abusive behavior"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={loadingSubmit} className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer">
                  {loadingSubmit ? 'Saving...' : showModal === 'agent' ? 'Add Agent' : showModal === 'team' ? 'Create Team' : 'Add to Ban List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
