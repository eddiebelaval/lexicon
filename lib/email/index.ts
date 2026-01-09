/**
 * Email Service (Resend Integration)
 *
 * Handles email delivery for digests and notifications.
 * Uses Resend API with React Email templates.
 */

import { Resend } from 'resend';
import type { Digest, UserPreferences } from '@/types';

// Lazy-initialize Resend client
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Missing RESEND_API_KEY environment variable');
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

/**
 * Check if email service is available
 */
export function isEmailAvailable(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Get the sender email address
 */
function getSenderEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'Lexicon <digest@lexicon.app>';
}

/**
 * Send a digest email to a user
 */
export async function sendDigestEmail(
  userEmail: string,
  userName: string,
  digest: Digest
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isEmailAvailable()) {
    console.warn('[Email] Resend not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const resend = getResend();

    const { data, error } = await resend.emails.send({
      from: getSenderEmail(),
      to: userEmail,
      subject: `📰 ${digest.title}`,
      html: generateDigestEmailHtml(userName, digest),
      text: generateDigestEmailText(userName, digest),
    });

    if (error) {
      console.error('[Email] Failed to send digest:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Digest sent to ${userEmail}: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('[Email] Error sending digest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a notification email
 */
export async function sendNotificationEmail(
  userEmail: string,
  userName: string,
  subject: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionLabel?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isEmailAvailable()) {
    console.warn('[Email] Resend not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const resend = getResend();

    const { data, error } = await resend.emails.send({
      from: getSenderEmail(),
      to: userEmail,
      subject,
      html: generateNotificationEmailHtml(userName, title, message, actionUrl, actionLabel),
      text: generateNotificationEmailText(userName, title, message, actionUrl),
    });

    if (error) {
      console.error('[Email] Failed to send notification:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Notification sent to ${userEmail}: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('[Email] Error sending notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if user should receive emails based on preferences
 */
export function shouldSendEmail(
  preferences: UserPreferences,
  emailType: 'digest' | 'notification'
): boolean {
  if (!preferences.emailDigests) {
    return false;
  }

  if (emailType === 'digest') {
    // For digests, check frequency
    return preferences.emailFrequency !== 'never';
  }

  // For notifications, send if digests are enabled
  return true;
}

// ============================================
// HTML Email Templates
// ============================================

function generateDigestEmailHtml(userName: string, digest: Digest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lexicon.app';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${digest.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #141414; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, #1a1a1a 0%, #141414 100%); border-bottom: 1px solid #252525;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #38bdf8; font-size: 24px; font-weight: 600;">📚 Lexicon</h1>
                  </td>
                  <td align="right">
                    <span style="color: #666; font-size: 14px;">${formatDate(digest.generatedAt)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0 0 10px; color: #999; font-size: 14px;">Hi ${userName},</p>
              <h2 style="margin: 0; color: #fff; font-size: 22px; font-weight: 600;">${digest.title}</h2>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #1a1a1a; border-radius: 8px; padding: 20px; border-left: 3px solid #38bdf8;">
                <p style="margin: 0; color: #ccc; font-size: 15px; line-height: 1.6;">${digest.summary}</p>
              </div>
            </td>
          </tr>

          <!-- Stats -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding-right: 10px;">
                    <div style="background-color: #1f1f1f; border-radius: 8px; padding: 15px; text-align: center;">
                      <p style="margin: 0 0 5px; color: #38bdf8; font-size: 24px; font-weight: 600;">${digest.updatesCount}</p>
                      <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Updates</p>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 10px;">
                    <div style="background-color: #1f1f1f; border-radius: 8px; padding: 15px; text-align: center;">
                      <p style="margin: 0 0 5px; color: #38bdf8; font-size: 24px; font-weight: 600;">${digest.storylinesCount}</p>
                      <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Storylines</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Full Content Preview -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="color: #aaa; font-size: 14px; line-height: 1.7;">
                ${digest.fullContent.slice(0, 500).replace(/\n/g, '<br>')}${digest.fullContent.length > 500 ? '...' : ''}
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px;" align="center">
              <a href="${appUrl}/digest/${digest.id}" style="display: inline-block; background-color: #38bdf8; color: #000; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                View Full Digest →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #0f0f0f; border-top: 1px solid #252525;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0; color: #555; font-size: 12px;">
                      You're receiving this because you have digest emails enabled.
                    </p>
                  </td>
                  <td align="right">
                    <a href="${appUrl}/settings/notifications" style="color: #555; font-size: 12px; text-decoration: none;">
                      Manage preferences
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generateDigestEmailText(userName: string, digest: Digest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lexicon.app';

  return `
LEXICON DAILY DIGEST
${formatDate(digest.generatedAt)}

Hi ${userName},

${digest.title}

SUMMARY
${digest.summary}

STATS
- ${digest.updatesCount} updates
- ${digest.storylinesCount} storylines affected

DETAILS
${digest.fullContent}

---

View full digest: ${appUrl}/digest/${digest.id}

Manage email preferences: ${appUrl}/settings/notifications
  `.trim();
}

function generateNotificationEmailHtml(
  userName: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionLabel?: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lexicon.app';

  const ctaHtml = actionUrl
    ? `
    <tr>
      <td style="padding: 20px 40px 40px;" align="center">
        <a href="${actionUrl}" style="display: inline-block; background-color: #38bdf8; color: #000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          ${actionLabel || 'View Details'} →
        </a>
      </td>
    </tr>
    `
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #141414; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 40px; background-color: #1a1a1a; border-bottom: 1px solid #252525;">
              <h1 style="margin: 0; color: #38bdf8; font-size: 20px; font-weight: 600;">📚 Lexicon</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 10px; color: #999; font-size: 14px;">Hi ${userName},</p>
              <h2 style="margin: 0 0 15px; color: #fff; font-size: 20px; font-weight: 600;">${title}</h2>
              <p style="margin: 0; color: #ccc; font-size: 15px; line-height: 1.6;">${message}</p>
            </td>
          </tr>

          ${ctaHtml}

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #0f0f0f; border-top: 1px solid #252525;">
              <p style="margin: 0; color: #555; font-size: 12px;">
                <a href="${appUrl}/settings/notifications" style="color: #555; text-decoration: none;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generateNotificationEmailText(
  userName: string,
  title: string,
  message: string,
  actionUrl?: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lexicon.app';

  return `
LEXICON NOTIFICATION

Hi ${userName},

${title}

${message}

${actionUrl ? `View details: ${actionUrl}` : ''}

---

Manage email preferences: ${appUrl}/settings/notifications
  `.trim();
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
