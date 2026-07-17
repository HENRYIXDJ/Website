'use server';

import { checkBotId } from 'botid/server';
import { Resend } from 'resend';
import { start } from 'workflow/api';
import { handleUserSignup } from '@/app/workflows/signup';

export async function signupAction(email: string) {
  try {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return { error: 'Invalid email address transmission' };
    }

    const { isBot } = await checkBotId();
    if (isBot) {
      console.warn(`[BotID Attack Vector Blocked]: ${email} flagged as automated agent.`);
      return { error: 'Access Denied: Automated agent detected by firewall' };
    }

    const run = await start(handleUserSignup, [email]);
    return { success: true, runId: run.runId };
  } catch (error: any) {
    console.error('[Signup Action Error]:', error);
    return { error: `Internal processing error: ${error.message || 'Workflow execution failed'}` };
  }
}

export async function contactAction(formData: { name: string; agency?: string; email: string; details: string }) {
  try {
    const { name, agency, email, details } = formData;
    if (!name || !email || !details) {
      return { error: 'Name, email, and details are required.' };
    }

    const { isBot } = await checkBotId();
    if (isBot) {
      console.warn(`[BotID Contact Blocked]: ${email} flagged as automated agent.`);
      return { error: 'Access Denied: Automated agent detected by firewall' };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 'PLACEHOLDER' || apiKey === 'YOUR_RESEND_API_KEY' || !apiKey.startsWith('re_')) {
      console.warn('RESEND_API_KEY is not configured or is set to a placeholder.');
      return { error: 'Resend API key is unconfigured on the server. Please configure your RESEND_API_KEY.' };
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'Henry IX Website <contact@henryix.com>',
      to: ['contact@henryix.com'],
      replyTo: email,
      subject: `New Booking Inquiry from ${name}`,
      text: `
You have received a new message from your website contact form.

Name: ${name}
Agency/Entity: ${agency || 'N/A'}
Email: ${email}

Details:
${details}
      `,
    });

    if (error) {
      console.error('Resend API error detail:', error);
      const isInvalidKey = error.message.toLowerCase().includes('api key') || error.message.toLowerCase().includes('unauthorized');
      const troubleshootingHint = isInvalidKey
        ? "Your RESEND_API_KEY environment variable is invalid or inactive. If this is deployed on Vercel, make sure you have added RESEND_API_KEY to your Vercel Project Environment Variables under settings, as .env.local is ignored in production."
        : "This domain may not be verified in Resend. If you are using Resend's free tier, you can only send emails to the email address you signed up with. To send to contact@henryix.com, you must verify the 'henryix.com' domain in your Resend Dashboard, or change the 'to' address in route.ts to your Resend signup email.";
      return { error: `Resend API Error: ${error.message}. Troubleshooting: ${troubleshootingHint}` };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error processing contact action:', error);
    return { error: `Resend API Execution Failure: ${error.message || 'Failed to send email'}` };
  }
}
