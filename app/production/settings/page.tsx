'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shell';
import { useProduction } from '@/components/production/production-context';
import {
  Settings,
  FileText,
  Bell,
  Upload,
  Users,
  Save,
  Check,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import type { Production } from '@/types';

type SettingsTab = 'general' | 'notifications' | 'import' | 'team';

const tabs: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'import', label: 'Import', icon: Upload },
  { id: 'team', label: 'Team', icon: Users },
];

export default function SettingsPage() {
  const { production, loading: prodLoading, refetch } = useProduction();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  if (prodLoading) {
    return (
      <div>
        <PageHeader title="Settings" description="Production configuration and preferences" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin" size={20} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </div>
    );
  }

  if (!production) {
    return (
      <div>
        <PageHeader title="Settings" description="Production configuration and preferences" />
        <div className="text-center py-20" style={{ color: 'var(--text-tertiary)' }}>
          <p>No production found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description={`Configure ${production.name}`} />

      <div style={{ padding: '0 24px 24px' }}>
        {/* Tab bar */}
        <div style={{
          display: 'flex',
          gap: '2px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '24px',
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'color var(--dur-fast) var(--ease-out)',
                  marginBottom: '-1px',
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'general' && (
          <GeneralTab production={production} onSaved={refetch} />
        )}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'import' && <ImportTab productionId={production.id} />}
        {activeTab === 'team' && <TeamTab />}
      </div>
    </div>
  );
}

// ─── General Tab ───────────────────────────────

function GeneralTab({ production, onSaved }: { production: Production; onSaved: () => void }) {
  const [name, setName] = useState(production.name);
  const [season, setSeason] = useState(production.season || '');
  const [status, setStatus] = useState(production.status);
  const [startDate, setStartDate] = useState(production.startDate?.split('T')[0] || '');
  const [endDate, setEndDate] = useState(production.endDate?.split('T')[0] || '');
  const [notes, setNotes] = useState(production.notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/productions/${production.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          season: season || null,
          status,
          startDate: startDate || null,
          endDate: endDate || null,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        setSaved(true);
        onSaved();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // Silently fail for now
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '560px' }}>
      <FieldGroup label="Production Name">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
        />
      </FieldGroup>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FieldGroup label="Season">
          <input
            type="text"
            value={season}
            onChange={e => setSeason(e.target.value)}
            placeholder="e.g., Season 8"
            style={inputStyle}
          />
        </FieldGroup>

        <FieldGroup label="Status">
          <select
            value={status}
            onChange={e => setStatus(e.target.value as Production['status'])}
            style={inputStyle}
          >
            <option value="pre_production">Pre-Production</option>
            <option value="active">Active</option>
            <option value="post_production">Post-Production</option>
            <option value="wrapped">Wrapped</option>
          </select>
        </FieldGroup>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FieldGroup label="Start Date">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={inputStyle}
          />
        </FieldGroup>

        <FieldGroup label="End Date">
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={inputStyle}
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Notes">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Production notes, special instructions..."
          style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
        />
      </FieldGroup>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 20px',
          borderRadius: 'var(--radius-md)',
          background: saved ? 'var(--healthy)' : 'var(--accent)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 500,
          border: 'none',
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
          transition: 'all var(--dur-fast) var(--ease-out)',
          marginTop: '8px',
        }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
        {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
      </button>
    </div>
  );
}

// ─── Notifications Tab ─────────────────────────

function NotificationsTab() {
  const [emailDigests, setEmailDigests] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState<'daily' | 'weekly' | 'never'>('daily');
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/preferences')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setEmailDigests(data.data.emailDigests ?? false);
          setEmailFrequency(data.data.emailFrequency ?? 'daily');
          setMonitoringEnabled(data.data.monitoringEnabled ?? true);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailDigests, emailFrequency, monitoringEnabled }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '560px' }}>
      <ToggleRow
        label="Email Digests"
        description="Receive daily or weekly email summaries of production activity"
        checked={emailDigests}
        onChange={setEmailDigests}
      />

      {emailDigests && (
        <FieldGroup label="Digest Frequency">
          <select
            value={emailFrequency}
            onChange={e => setEmailFrequency(e.target.value as 'daily' | 'weekly' | 'never')}
            style={inputStyle}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="never">Never</option>
          </select>
        </FieldGroup>
      )}

      <ToggleRow
        label="Real-time Monitoring"
        description="Enable automatic detection of schedule conflicts, missed deadlines, and anomalies"
        checked={monitoringEnabled}
        onChange={setMonitoringEnabled}
      />

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 20px',
          borderRadius: 'var(--radius-md)',
          background: saved ? 'var(--healthy)' : 'var(--accent)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 500,
          border: 'none',
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
          marginTop: '16px',
        }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
        {saving ? 'Saving...' : saved ? 'Saved' : 'Save Preferences'}
      </button>
    </div>
  );
}

// ─── Import Tab ────────────────────────────────

function ImportTab({ productionId }: { productionId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('productionId', productionId);

    try {
      const res = await fetch('/api/import/cast', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: `Parsed ${data.data?.rowCount || 0} cast members. Review and commit to save.` });
      } else {
        setResult({ success: false, message: data.error?.message || 'Import failed' });
      }
    } catch {
      setResult({ success: false, message: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        border: '2px dashed var(--border)',
        background: 'var(--bg-card)',
        textAlign: 'center',
      }}>
        <Upload size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
          Import Cast from Excel
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginBottom: '16px' }}>
          Upload a .xlsx or .csv file with cast member data. Lexi will parse names, roles, and contact info.
        </p>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={e => setFile(e.target.files?.[0] || null)}
          style={{ display: 'none' }}
          id="cast-file-input"
        />
        <label
          htmlFor="cast-file-input"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <FileText size={14} />
          {file ? file.name : 'Choose File'}
        </label>

        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              marginLeft: '8px',
              opacity: uploading ? 0.7 : 1,
            }}
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        )}
      </div>

      {result && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: result.success ? 'var(--healthy-soft)' : 'var(--critical-soft)',
          border: `1px solid ${result.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          fontSize: '13px',
          color: 'var(--text-secondary)',
        }}>
          {result.message}
        </div>
      )}
    </div>
  );
}

// ─── Team Tab ──────────────────────────────────

function TeamTab() {
  return (
    <div style={{ maxWidth: '560px' }}>
      <a
        href="/production/team"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          textDecoration: 'none',
          transition: 'border-color var(--dur-fast) var(--ease-out)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={20} style={{ color: 'var(--accent)' }} />
          <div>
            <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>Team Management</p>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Manage team members, roles, and permissions
            </p>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
      </a>
    </div>
  );
}

// ─── Shared Components ─────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div>
        <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: '40px',
          height: '22px',
          borderRadius: '11px',
          border: 'none',
          background: checked ? 'var(--accent)' : 'var(--bg-input)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background var(--dur-fast) var(--ease-out)',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: '3px',
          left: checked ? '21px' : '3px',
          transition: 'left var(--dur-fast) var(--ease-out)',
        }} />
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  fontFamily: 'var(--font-body)',
  outline: 'none',
};
