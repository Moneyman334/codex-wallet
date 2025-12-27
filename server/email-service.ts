import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

interface BetaMerchantWelcomeData {
  businessName: string;
  contactName: string;
  email: string;
  monthlyVolume: string;
  businessType: string;
  autoApproved?: boolean;
  apiKeys?: { publishable: string; secret: string };
}

export async function sendBetaMerchantWelcomeEmail(data: BetaMerchantWelcomeData) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .highlight {
      background: #f3f4f6;
      padding: 20px;
      border-left: 4px solid #667eea;
      margin: 20px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .benefits {
      list-style: none;
      padding: 0;
    }
    .benefits li {
      padding: 10px 0;
      padding-left: 30px;
      position: relative;
    }
    .benefits li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
      font-size: 20px;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      border-radius: 0 0 10px 10px;
      border: 1px solid #e0e0e0;
      border-top: none;
      color: #6b7280;
      font-size: 14px;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 20px 0;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 32px;">🏴‍☠️ Welcome to CODEX Pay Beta</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Building the Future Together</p>
  </div>
  
  <div class="content">
    <p>Hey ${data.contactName},</p>
    
    <p>Welcome aboard, founding partner! 🎉</p>
    
    ${data.autoApproved && data.apiKeys ? `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h2 style="margin: 0; font-size: 28px;">🎉 Account Created</h2>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Welcome to the CODEX Pay Beta Program</p>
    </div>
    
    <p>Your merchant account for <strong>${data.businessName}</strong> has been set up. You can now access your API credentials below.</p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #92400e;">🔑 Your API Keys (Store These Safely!)</h3>
      
      <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #6b7280; font-weight: bold;">PUBLISHABLE KEY (Safe to use in frontend)</p>
        <code style="display: block; background: #f3f4f6; padding: 10px; border-radius: 3px; font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace;">${data.apiKeys?.publishable}</code>
      </div>
      
      <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #dc2626; font-weight: bold;">⚠️ SECRET KEY (NEVER share or expose in client code)</p>
        <code style="display: block; background: #fef2f2; padding: 10px; border-radius: 3px; font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace; color: #dc2626;">${data.apiKeys?.secret}</code>
      </div>
      
      <p style="margin: 15px 0 0 0; font-size: 14px; color: #92400e;">
        <strong>⚠️ IMPORTANT:</strong> These keys are shown ONLY ONCE. Save them somewhere safe (password manager, environment variables, etc). If you lose them, you'll need to regenerate new ones from your dashboard.
      </p>
    </div>
    
    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #1e40af;">🚀 Getting Started</h3>
      <ol style="margin: 10px 0; padding-left: 20px; color: #1e3a8a;">
        <li style="margin: 10px 0;">Log in to your CODEX Pay dashboard at <a href="https://getcodexpay.com/codex-pay/dashboard" style="color: #2563eb;">getcodexpay.com/codex-pay/dashboard</a></li>
        <li style="margin: 10px 0;">Configure your settlement wallet address</li>
        <li style="margin: 10px 0;">Use your API keys to create payment intents</li>
        <li style="margin: 10px 0;">Review our documentation for integration guidance</li>
      </ol>
    </div>
    ` : `
    <p>Your application for <strong>${data.businessName}</strong> has been received. We're reviewing applications and will follow up with you via email.</p>
    `}
    
    <div class="highlight">
      <p style="margin: 0; font-weight: bold; color: #667eea;">CODEX Philosophy: "Never knowing the outcome, only believe in yourself"</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">This isn't about guarantees. It's about belief, courage, and moving forward together as equals.</p>
    </div>

    ${!data.autoApproved ? `
    <h3 style="color: #1f2937;">What Happens Next?</h3>
    <ul class="benefits">
      <li>We'll review your application and follow up via email</li>
      <li>Approved partners receive onboarding guidance</li>
      <li>Beta program includes promotional processing credits</li>
      <li>Competitive fee structure for crypto payments</li>
      <li>Direct crypto settlements to your wallet</li>
    </ul>
    ` : `
    <h3 style="color: #1f2937;">🎁 Beta Program Benefits</h3>
    <ul class="benefits">
      <li>Beta promotional processing credits included</li>
      <li>Competitive fee structure for crypto payments</li>
      <li>Direct crypto settlements to your wallet</li>
      <li>Priority support during beta period</li>
      <li>Early access to new features</li>
      <li>Your feedback shapes the product</li>
    </ul>
    `}

    <div class="stats">
      <div class="stat">
        <div class="stat-value">Beta</div>
        <div class="stat-label">Early Access</div>
      </div>
      <div class="stat">
        <div class="stat-value">Crypto</div>
        <div class="stat-label">Native Payments</div>
      </div>
      <div class="stat">
        <div class="stat-value">Direct</div>
        <div class="stat-label">Settlements</div>
      </div>
    </div>

    <h3 style="color: #1f2937;">Your Application Details</h3>
    <div style="background: #f9fafb; padding: 15px; border-radius: 5px; font-size: 14px;">
      <p style="margin: 5px 0;"><strong>Business:</strong> ${data.businessName}</p>
      <p style="margin: 5px 0;"><strong>Type:</strong> ${data.businessType}</p>
      <p style="margin: 5px 0;"><strong>Monthly Volume:</strong> ${data.monthlyVolume}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <p style="margin-bottom: 10px; color: #6b7280;">Questions? Just reply to this email.</p>
    </div>

    <p>This is a partnership built on <strong>love, not money</strong>. We succeed together or not at all.</p>
    
    <p style="margin-top: 30px;">
      To sovereignty,<br>
      <strong>The CODEX Pay Team</strong><br>
      <span style="color: #6b7280; font-size: 14px;">Building with you, not for you</span>
    </p>
  </div>
  
  <div class="footer">
    <p style="margin: 0;">CODEX Pay Beta Program</p>
    <p style="margin: 5px 0 0 0;">Sovereign. Crypto-Native. Equal Partnership.</p>
  </div>
</body>
</html>
    `;

    const result = await client.emails.send({
      from: fromEmail,
      to: data.email,
      subject: `🏴‍☠️ Welcome to CODEX Pay Beta - ${data.businessName}`,
      html: emailHtml,
    });

    console.log(`📧 Welcome email sent to ${data.email} (Resend ID: ${result.data?.id})`);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}
