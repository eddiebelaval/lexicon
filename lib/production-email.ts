/**
 * Production Email Service
 *
 * Sends production documents (call sheets, reports, contract summaries)
 * to crew and cast via Resend. Lexi can trigger these via Telegram or web.
 *
 * All emails include both HTML body and plain text fallback.
 */

import { Resend } from 'resend';
import { generateCallSheet } from './call-sheet';
import { buildProductionSummary } from './lexi';
import { getAllAlerts } from './production-alerts';
import { listCastContracts } from './cast-contracts';
import { listCrewMembers } from './crew';
import {
  renderCallSheetHtml,
  renderProductionReportHtml,
  renderContractSummaryHtml,
  type ProductionReportData,
} from './documents';
import type { CrewMember } from '@/types';

// ============================================
// Resend Client
// ============================================

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('Missing RESEND_API_KEY');
    _resend = new Resend(apiKey);
  }
  return _resend;
}

function getSender(): string {
  return process.env.RESEND_FROM_EMAIL || 'Lexi <lexi@id8labs.app>';
}

// ============================================
// Send Result Type
// ============================================

export interface SendResult {
  success: boolean;
  sentTo: string[];
  failed: string[];
  error?: string;
}

// ============================================
// Email: Call Sheet
// ============================================

/**
 * Generate and email a call sheet to all crew assigned to scenes on that date.
 * If no specific recipients, sends to all active crew with email addresses.
 */
export async function emailCallSheet(
  productionId: string,
  date: string,
  recipients?: string[]
): Promise<SendResult> {
  const callSheet = await generateCallSheet(productionId, date);

  if (callSheet.entries.length === 0) {
    return { success: false, sentTo: [], failed: [], error: `No scenes scheduled for ${date}` };
  }

  const html = renderCallSheetHtml(callSheet);
  const subject = `Call Sheet — ${callSheet.productionName} — ${formatDateShort(date)}`;

  // Determine recipients
  const toAddresses = recipients || await getCrewEmails(productionId);

  if (toAddresses.length === 0) {
    return { success: false, sentTo: [], failed: [], error: 'No crew members have email addresses on file' };
  }

  return sendToMultiple(toAddresses, subject, html, stripHtml(html));
}

// ============================================
// Email: Production Report
// ============================================

/**
 * Generate and email a production report to EPs and producers.
 */
export async function emailProductionReport(
  productionId: string,
  recipients?: string[]
): Promise<SendResult> {
  const summary = await buildProductionSummary(productionId);
  if (!summary) {
    return { success: false, sentTo: [], failed: [], error: 'Could not build production summary' };
  }

  const alerts = await getAllAlerts(productionId);

  const reportData: ProductionReportData = {
    productionName: summary.production.name,
    season: summary.production.season,
    totalCast: summary.totalCast,
    signedContracts: summary.signedCast,
    totalScenes: summary.totalScenes,
    scenesShot: summary.scenesShot,
    totalCrew: summary.totalCrew,
    activeCrew: summary.totalCrew,
    upcomingScenes: summary.upcomingScenes,
    incompleteContracts: summary.incompleteContracts,
    alerts: alerts.map(a => ({ severity: a.severity || 'info', message: a.description })),
    generatedAt: new Date().toISOString(),
  };

  const html = renderProductionReportHtml(reportData);
  const subject = `Production Report — ${summary.production.name}`;

  const toAddresses = recipients || await getProducerEmails(productionId);

  if (toAddresses.length === 0) {
    return { success: false, sentTo: [], failed: [], error: 'No producers have email addresses on file' };
  }

  return sendToMultiple(toAddresses, subject, html, stripHtml(html));
}

// ============================================
// Email: Contract Summary
// ============================================

/**
 * Generate and email a contract summary to coordinators and EPs.
 */
export async function emailContractSummary(
  productionId: string,
  productionName: string,
  recipients?: string[]
): Promise<SendResult> {
  const contractResult = await listCastContracts(productionId);
  const contracts = contractResult.items ?? contractResult;

  if (!Array.isArray(contracts) || contracts.length === 0) {
    return { success: false, sentTo: [], failed: [], error: 'No contracts found' };
  }

  // Build cast name map (use entity IDs as fallback)
  const castNames = new Map<string, string>();
  for (const c of contracts) {
    castNames.set(c.castEntityId, c.castEntityId);
  }

  const html = renderContractSummaryHtml(productionName, contracts, castNames);
  const subject = `Contract Summary — ${productionName}`;

  const toAddresses = recipients || await getProducerEmails(productionId);

  if (toAddresses.length === 0) {
    return { success: false, sentTo: [], failed: [], error: 'No recipients have email addresses on file' };
  }

  return sendToMultiple(toAddresses, subject, html, stripHtml(html));
}

// ============================================
// Helpers
// ============================================

async function sendToMultiple(
  addresses: string[],
  subject: string,
  html: string,
  text: string
): Promise<SendResult> {
  const resend = getResend();
  const sentTo: string[] = [];
  const failed: string[] = [];

  // Resend supports batch sending — send to all at once
  try {
    const { error } = await resend.emails.send({
      from: getSender(),
      to: addresses,
      subject,
      html,
      text,
    });

    if (error) {
      return { success: false, sentTo: [], failed: addresses, error: error.message };
    }

    return { success: true, sentTo: addresses, failed: [] };
  } catch (err) {
    return {
      success: false,
      sentTo: [],
      failed: addresses,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function getCrewEmailsByFilter(
  productionId: string,
  filter?: (m: CrewMember) => boolean
): Promise<string[]> {
  const result = await listCrewMembers(productionId);
  const members: CrewMember[] = Array.isArray(result) ? result : (result as { items: CrewMember[] }).items || [];
  return members
    .filter(m => m.isActive && m.contactEmail && (!filter || filter(m)))
    .map(m => m.contactEmail!);
}

function getCrewEmails(productionId: string): Promise<string[]> {
  return getCrewEmailsByFilter(productionId);
}

function getProducerEmails(productionId: string): Promise<string[]> {
  return getCrewEmailsByFilter(productionId, m => m.role === 'staff' || m.role === 'producer');
}

function formatDateShort(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gs, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
