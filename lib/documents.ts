/**
 * Document Generator — Production Documents as HTML
 *
 * Renders call sheets, production reports, and contract summaries
 * as clean HTML suitable for email bodies and PDF conversion.
 *
 * Design: id8Labs factory aesthetic — clean, professional, monochrome
 * with production data front and center.
 */

import type { CallSheet, CallSheetEntry } from './call-sheet';
import type { CastContract, ProdScene, CrewMember } from '@/types';

// ============================================
// Shared Styles
// ============================================

const STYLES = `
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #111; }
  .doc { max-width: 700px; margin: 0 auto; padding: 40px; }
  .doc-header { border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
  .doc-title { font-size: 24px; font-weight: 700; margin: 0 0 4px; }
  .doc-subtitle { font-size: 14px; color: #666; margin: 0; }
  .doc-meta { display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #999; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin: 0 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e5e5; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ddd; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .badge-green { background: #dcfce7; color: #166534; }
  .badge-yellow { background: #fef9c3; color: #854d0e; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-gray { background: #f3f4f6; color: #374151; }
  .scene-block { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .scene-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .scene-title { font-weight: 600; font-size: 15px; }
  .scene-detail { font-size: 13px; color: #666; margin: 4px 0; }
  .scene-crew { margin-top: 8px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #999; text-align: center; }
  .stat-row { display: flex; gap: 24px; margin-bottom: 16px; }
  .stat { text-align: center; flex: 1; }
  .stat-value { font-size: 28px; font-weight: 700; color: #111; }
  .stat-label { font-size: 11px; color: #666; text-transform: uppercase; }
  @media print { body { background: #fff; } .doc { padding: 20px; } }
`;

function wrap(title: string, content: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title><style>${STYLES}</style></head>
<body><div class="doc">${content}</div></body></html>`;
}

function statusBadge(status: string): string {
  const colors: Record<string, string> = {
    signed: 'green', shot: 'green', complete: 'green',
    pending: 'yellow', scheduled: 'blue', postponed: 'yellow',
    offer_sent: 'blue', active: 'blue',
    dnc: 'red', cancelled: 'red', declined: 'red',
  };
  return `<span class="badge badge-${colors[status] || 'gray'}">${status.replace(/_/g, ' ')}</span>`;
}

// ============================================
// Call Sheet Document
// ============================================

export function renderCallSheetHtml(callSheet: CallSheet): string {
  const { productionName, date, entries, generalNotes } = callSheet;

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  let content = `
    <div class="doc-header">
      <h1 class="doc-title">Call Sheet</h1>
      <p class="doc-subtitle">${productionName}</p>
      <div class="doc-meta">
        <span>${formattedDate}</span>
        <span>${entries.length} scene${entries.length !== 1 ? 's' : ''} scheduled</span>
      </div>
    </div>
  `;

  if (entries.length === 0) {
    content += `<p style="color: #666; text-align: center; padding: 40px 0;">No scenes scheduled for this date.</p>`;
  } else {
    for (const entry of entries) {
      const { scene, crewAssignments, castNames } = entry;
      content += `
        <div class="scene-block">
          <div class="scene-header">
            <span class="scene-title">${scene.sceneNumber ? `#${scene.sceneNumber} — ` : ''}${scene.title}</span>
            ${statusBadge(scene.status)}
          </div>
          ${scene.scheduledTime ? `<div class="scene-detail">Time: ${scene.scheduledTime}</div>` : ''}
          ${scene.location ? `<div class="scene-detail">Location: ${scene.location}${scene.locationDetails ? ` (${scene.locationDetails})` : ''}</div>` : ''}
          ${castNames.length > 0 ? `<div class="scene-detail">Cast: ${castNames.join(', ')}</div>` : ''}
          ${scene.equipmentNotes ? `<div class="scene-detail">Equipment: ${scene.equipmentNotes}</div>` : ''}
          ${scene.isSelfShot ? `<div class="scene-detail"><span class="badge badge-gray">Self-Shot</span></div>` : ''}
          ${crewAssignments.length > 0 ? `
            <div class="scene-crew">
              <table>
                <tr><th>Crew</th><th>Role</th><th>Notes</th></tr>
                ${crewAssignments.map(a => `
                  <tr>
                    <td>${a.crewName}</td>
                    <td>${a.role.toUpperCase()}</td>
                    <td>${a.notes || '—'}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          ` : ''}
        </div>
      `;
    }
  }

  if (generalNotes) {
    content += `
      <div class="section">
        <h2 class="section-title">Production Notes</h2>
        <p style="font-size: 13px; color: #444;">${generalNotes}</p>
      </div>
    `;
  }

  content += `<div class="footer">Generated by Lexi — Lexicon Production Intelligence</div>`;

  return wrap(`Call Sheet — ${productionName} — ${formattedDate}`, content);
}

// ============================================
// Production Report Document
// ============================================

export interface ProductionReportData {
  productionName: string;
  season: string | null;
  totalCast: number;
  signedContracts: number;
  totalScenes: number;
  scenesShot: number;
  totalCrew: number;
  activeCrew: number;
  upcomingScenes: ProdScene[];
  incompleteContracts: CastContract[];
  alerts: { severity: string; message: string }[];
  generatedAt: string;
}

export function renderProductionReportHtml(data: ProductionReportData): string {
  const signedPct = data.totalCast > 0 ? Math.round((data.signedContracts / data.totalCast) * 100) : 0;
  const shotPct = data.totalScenes > 0 ? Math.round((data.scenesShot / data.totalScenes) * 100) : 0;

  let content = `
    <div class="doc-header">
      <h1 class="doc-title">Production Report</h1>
      <p class="doc-subtitle">${data.productionName}${data.season ? ` — ${data.season}` : ''}</p>
      <div class="doc-meta">
        <span>Generated ${new Date(data.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Overview</h2>
      <table>
        <tr><th>Metric</th><th>Value</th><th>Progress</th></tr>
        <tr><td>Contracts Signed</td><td>${data.signedContracts} / ${data.totalCast}</td><td>${signedPct}%</td></tr>
        <tr><td>Scenes Shot</td><td>${data.scenesShot} / ${data.totalScenes}</td><td>${shotPct}%</td></tr>
        <tr><td>Active Crew</td><td>${data.activeCrew} / ${data.totalCrew}</td><td>—</td></tr>
      </table>
    </div>
  `;

  if (data.alerts.length > 0) {
    content += `
      <div class="section">
        <h2 class="section-title">Alerts (${data.alerts.length})</h2>
        ${data.alerts.map(a => `
          <div style="padding: 8px 12px; margin-bottom: 6px; border-left: 3px solid ${a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#3b82f6'}; background: #fafafa; font-size: 13px;">
            ${a.message}
          </div>
        `).join('')}
      </div>
    `;
  }

  if (data.upcomingScenes.length > 0) {
    content += `
      <div class="section">
        <h2 class="section-title">Upcoming Scenes</h2>
        <table>
          <tr><th>Scene</th><th>Date</th><th>Location</th><th>Status</th></tr>
          ${data.upcomingScenes.slice(0, 10).map(s => `
            <tr>
              <td>${s.sceneNumber ? `#${s.sceneNumber} ` : ''}${s.title}</td>
              <td>${s.scheduledDate || 'TBD'}</td>
              <td>${s.location || 'TBD'}</td>
              <td>${statusBadge(s.status)}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  if (data.incompleteContracts.length > 0) {
    content += `
      <div class="section">
        <h2 class="section-title">Incomplete Contracts (${data.incompleteContracts.length})</h2>
        <table>
          <tr><th>Cast</th><th>Status</th><th>Missing</th></tr>
          ${data.incompleteContracts.map(c => {
            const missing: string[] = [];
            if (!c.shootDone) missing.push('Shoot');
            if (!c.interviewDone) missing.push('INTV');
            if (!c.pickupDone) missing.push('PU');
            if (!c.paymentDone) missing.push('$');
            return `
              <tr>
                <td>${c.castEntityId}</td>
                <td>${statusBadge(c.contractStatus)}</td>
                <td>${missing.join(', ')}</td>
              </tr>
            `;
          }).join('')}
        </table>
      </div>
    `;
  }

  content += `<div class="footer">Generated by Lexi — Lexicon Production Intelligence</div>`;

  return wrap(`Production Report — ${data.productionName}`, content);
}

// ============================================
// Contract Summary Document
// ============================================

export function renderContractSummaryHtml(
  productionName: string,
  contracts: CastContract[],
  castNames: Map<string, string>
): string {
  const signed = contracts.filter(c => c.contractStatus === 'signed').length;
  const pending = contracts.filter(c => c.contractStatus === 'pending').length;
  const total = contracts.length;

  const content = `
    <div class="doc-header">
      <h1 class="doc-title">Contract Summary</h1>
      <p class="doc-subtitle">${productionName} — ${total} cast member${total !== 1 ? 's' : ''}</p>
      <div class="doc-meta">
        <span>${signed} signed, ${pending} pending, ${total - signed - pending} other</span>
      </div>
    </div>

    <div class="section">
      <table>
        <tr><th>Cast</th><th>Status</th><th>Type</th><th>Shoot</th><th>INTV</th><th>PU</th><th>$</th></tr>
        ${contracts.map(c => `
          <tr>
            <td>${castNames.get(c.castEntityId) || c.castEntityId}</td>
            <td>${statusBadge(c.contractStatus)}</td>
            <td>${c.paymentType ? c.paymentType.toUpperCase() : '—'}</td>
            <td>${c.shootDone ? 'Done' : '—'}</td>
            <td>${c.interviewDone ? 'Done' : '—'}</td>
            <td>${c.pickupDone ? 'Done' : '—'}</td>
            <td>${c.paymentDone ? 'Done' : '—'}</td>
          </tr>
        `).join('')}
      </table>
    </div>

    <div class="footer">Generated by Lexi — Lexicon Production Intelligence</div>
  `;

  return wrap(`Contract Summary — ${productionName}`, content);
}
