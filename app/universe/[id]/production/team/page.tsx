'use client';

/**
 * Team Setup Page — Manage crew Telegram connections
 *
 * Shows all crew members with their connection status.
 * One-click code generation, copy-to-clipboard, and QR-less
 * setup instructions. Designed for a coordinator to sit with
 * a crew member and get them connected in 60 seconds.
 */

import { useState, useEffect, useCallback } from 'react';
import { useProduction } from '@/components/production/production-context';
import {
  Send,
  CheckCircle2,
  Copy,
  Loader2,
  UserCog,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrewMember } from '@/types';

interface CrewWithTelegram extends CrewMember {
  telegramUserId?: string | null;
  telegramUsername?: string | null;
}

type SetupStep = 'idle' | 'generating' | 'ready' | 'copied';

export default function TeamSetupPage() {
  const { production } = useProduction();
  const [crew, setCrew] = useState<CrewWithTelegram[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCode, setActiveCode] = useState<{
    crewId: string;
    code: string;
    step: SetupStep;
  } | null>(null);

  const fetchCrew = useCallback(async () => {
    if (!production) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crew?productionId=${production.id}`);
      const data = await res.json();
      if (data.success) {
        setCrew(data.data.items ?? data.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch crew:', err);
    } finally {
      setLoading(false);
    }
  }, [production]);

  useEffect(() => {
    if (production) fetchCrew();
  }, [production, fetchCrew]);

  const generateCode = async (crewMemberId: string) => {
    setActiveCode({ crewId: crewMemberId, code: '', step: 'generating' });
    try {
      const res = await fetch('/api/telegram/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crewMemberId }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveCode({
          crewId: crewMemberId,
          code: data.data.code,
          step: 'ready',
        });
      }
    } catch (err) {
      console.error('Failed to generate code:', err);
      setActiveCode(null);
    }
  };

  const copyCommand = (code: string) => {
    navigator.clipboard.writeText(`/start ${code}`);
    setActiveCode((prev) =>
      prev ? { ...prev, step: 'copied' } : null
    );
    setTimeout(() => {
      setActiveCode((prev) =>
        prev?.step === 'copied' ? { ...prev, step: 'ready' } : prev
      );
    }, 2000);
  };

  function renderActionButton(member: CrewWithTelegram, isConnected: boolean, isActive: boolean) {
    if (isConnected) {
      return <span className="text-xs text-emerald-400/80 font-medium">Connected</span>;
    }

    if (isActive && activeCode!.step === 'generating') {
      return <Loader2 className="h-4 w-4 animate-spin text-sky-400" />;
    }

    if (isActive && (activeCode!.step === 'ready' || activeCode!.step === 'copied')) {
      return (
        <button
          type="button"
          onClick={() => copyCommand(activeCode!.code)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors',
            activeCode!.step === 'copied'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20'
          )}
        >
          {activeCode!.step === 'copied' ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              /start {activeCode!.code}
            </>
          )}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => generateCode(member.id)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 border border-[#2a2a2a] rounded hover:text-sky-400 hover:border-sky-500/30 hover:bg-sky-500/5 transition-colors"
      >
        <Send className="h-3 w-3" />
        Connect Telegram
      </button>
    );
  }

  const connectedCount = crew.filter((c) => c.telegramUserId).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading team...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Connect Your Team</h1>
        <p className="text-sm text-gray-400 mt-1">
          Each crew member gets their own Telegram connection to Lexi.
          They can ask questions, update the board, and mark tasks done — all from their phone.
        </p>
        <div className="mt-3 text-xs text-gray-500">
          {connectedCount} of {crew.length} crew connected
          {connectedCount === crew.length && crew.length > 0 && (
            <span className="ml-2 text-emerald-400">— All connected</span>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-lg border border-[#1a1a1a] bg-[#141414] p-5">
        <h2 className="text-sm font-medium text-white/80 mb-3">How it works</h2>
        <div className="flex items-start gap-6 text-sm text-gray-400">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-white/70 font-medium mb-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold">1</span>
              Generate a code
            </div>
            <p className="text-xs text-gray-500 pl-7">Click the button next to a crew member&apos;s name.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-600 mt-1 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-white/70 font-medium mb-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold">2</span>
              Open Telegram
            </div>
            <p className="text-xs text-gray-500 pl-7">Find @LexiProductionBot and tap Start.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-600 mt-1 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-white/70 font-medium mb-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold">3</span>
              Paste the code
            </div>
            <p className="text-xs text-gray-500 pl-7">Send /start CODE — connected in seconds.</p>
          </div>
        </div>
      </div>

      {/* Crew list */}
      <div className="space-y-2">
        {crew.map((member) => {
          const isConnected = !!member.telegramUserId;
          const isActive = activeCode?.crewId === member.id;

          return (
            <div
              key={member.id}
              className={cn(
                'rounded-lg border bg-[#141414] p-4 transition-all',
                isConnected
                  ? 'border-emerald-500/20'
                  : isActive
                    ? 'border-sky-500/30'
                    : 'border-[#1a1a1a]'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold',
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-[#1f1f1f] text-gray-400'
                    )}
                  >
                    {isConnected ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      member.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-200">
                      {member.name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {member.role}
                      {isConnected && member.telegramUsername && (
                        <span className="ml-2 text-sky-400/60">
                          @{member.telegramUsername}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {renderActionButton(member, isConnected, isActive)}
              </div>

              {/* Expanded instructions when code is ready */}
              {isActive && activeCode.step === 'ready' && (
                <div className="mt-3 pt-3 border-t border-[#1a1a1a] text-xs text-gray-500">
                  Tell {member.name}: Open Telegram, search for <span className="text-sky-400">@LexiProductionBot</span>, tap Start, and paste the code above. Expires in 24 hours.
                </div>
              )}
            </div>
          );
        })}

        {crew.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <UserCog className="h-10 w-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">No crew members yet.</p>
            <p className="text-xs text-gray-600 mt-1">Add crew through the intake wizard or crew board first.</p>
          </div>
        )}
      </div>

      {/* Refresh */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={fetchCrew}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh connection status
        </button>
      </div>
    </div>
  );
}
