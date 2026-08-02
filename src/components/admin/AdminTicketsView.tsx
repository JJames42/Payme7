import React, { useState } from 'react';
import { ChatSession } from '../../types';
import { Ticket, Mail, Clock, CheckCircle2, AlertCircle, Search, Filter, MessageSquare, ArrowUpRight, User } from 'lucide-react';

interface AdminTicketsViewProps {
  activeNav: string;
  chats: ChatSession[];
  onSelectChat: (chat: ChatSession) => void;
}

export const AdminTicketsView: React.FC<AdminTicketsViewProps> = ({ activeNav, chats, onSelectChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');

  const isEmail = activeNav === 'Email Support';

  const ticketChats = chats.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      (c.userName && c.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.userEmail && c.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.caseId && c.caseId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'open' && c.status === 'active') ||
      (statusFilter === 'pending' && (c.status === 'pending' || c.status === 'bot')) ||
      (statusFilter === 'resolved' && c.status === 'resolved');

    return matchesSearch && matchesStatus;
  });

  const openCount = chats.filter((c) => c.status === 'active').length;
  const pendingCount = chats.filter((c) => c.status === 'pending' || c.status === 'bot').length;
  const resolvedCount = chats.filter((c) => c.status === 'resolved').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              {isEmail ? <Mail className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEmail ? 'Email Support Inquiries' : 'Support Tickets & Offline Requests'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {isEmail
              ? 'Manage asynchronous customer email correspondence and support follow-ups.'
              : 'Track and resolve customer tickets, offline messages, and transaction reviews.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{pendingCount} Pending</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{openCount} Active</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${isEmail ? 'emails' : 'tickets'} by name, email, or ID...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-rose-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          {(['all', 'open', 'pending', 'resolved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                statusFilter === tab
                  ? 'bg-white text-rose-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab} ({tab === 'all' ? chats.length : tab === 'open' ? openCount : tab === 'pending' ? pendingCount : resolvedCount})
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        {ticketChats.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Ticket className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
            <div className="font-semibold text-slate-600 text-sm">No {isEmail ? 'email inquiries' : 'tickets'} found</div>
            <div className="text-xs">No records match your current search or filter criteria.</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {ticketChats.map((chat) => {
              const lastMsg = chat.messages[chat.messages.length - 1];
              const isResolved = chat.status === 'resolved';
              const isPending = chat.status === 'pending' || chat.status === 'bot';

              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-start sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {chat.userName ? chat.userName.substring(0, 2).toUpperCase() : 'CU'}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{chat.userName || 'Customer'}</span>
                        <span className="text-[11px] text-slate-500">{chat.userEmail || 'Not Provided'}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                          {chat.caseId || `#T-${chat.id.substring(0, 6)}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate max-w-xl">
                        {lastMsg ? lastMsg.text || 'Attachment received' : 'No messages in transcript'}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                        <span>Created: {new Date(chat.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Language: {chat.language === 'hk' ? 'Traditional Chinese (HK)' : 'English'}</span>
                        <span>•</span>
                        <span>Messages: {chat.messages.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isResolved
                          ? 'bg-slate-100 text-slate-600'
                          : isPending
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isResolved ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : isPending ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      <span className="capitalize">{chat.status === 'bot' ? 'pending' : chat.status}</span>
                    </span>

                    <button className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-colors">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
