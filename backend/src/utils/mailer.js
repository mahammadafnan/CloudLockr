const nodemailer = require('nodemailer');

/**
 * Send security posture email alerts to administrators
 * @param {Object} scan Log details of completed scan
 * @param {Array} findings List of active findings
 */
exports.sendSecurityAlert = async (scan, findings) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 2525;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const receiver = process.env.ALERT_RECEIVER || 'admin@cloudlockr.local';
  const sender = process.env.SMTP_FROM || '"CloudLockr Alerts" <alerts@cloudlockr.local>';

  const criticalIssues = findings.filter(f => f.severity === 'Critical');
  const highIssues = findings.filter(f => f.severity === 'High');
  
  // If there are no critical or high severity issues, skip email alert to reduce alert fatigue
  if (criticalIssues.length === 0 && highIssues.length === 0) {
    console.log('[Mailer] Posture is clean. Skipping alert email.');
    return;
  }

  const subject = `⚠️ CloudLockr Alert: Security Posture Score Dropped to ${scan.score}/100`;

  // Construct styled HTML body
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #1e3a8a; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; letter-spacing: 0.5px; }
        .content { padding: 24px; }
        .score-box { background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px; }
        .score-title { font-size: 11px; font-weight: bold; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px; }
        .score-value { font-size: 36px; font-weight: 800; color: #dc2626; margin: 8px 0; }
        .finding-card { border: 1px solid #fee2e2; background-color: #fff8f8; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
        .finding-title { font-weight: bold; font-size: 14px; color: #990000; }
        .finding-desc { font-size: 12px; color: #4b5563; margin-top: 4px; }
        .footer { background-color: #f9fafb; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af; border-t: 1px solid #e5e7eb; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>CLOUDLOCKR AUDIT ALERT</h1>
        </div>
        <div class="content">
          <p>Hello Administrator,</p>
          <p>CloudLockr completed an automated background scan and identified active security deviations.</p>
          
          <div class="score-box">
            <div class="score-title">Current Posture Score</div>
            <div class="score-value">${scan.score} / 100</div>
            <p style="margin: 0; font-size: 12px; color: #7f1d1d;">Action Recommended: Posture status is at risk.</p>
          </div>

          <h3 style="font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">Vulnerability Highlights (${criticalIssues.length + highIssues.length} Risks)</h3>
          
          ${criticalIssues.map(issue => `
            <div class="finding-card">
              <span style="font-size: 10px; font-weight: bold; background-color: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; border: 1px solid #fca5a5;">CRITICAL</span>
              <div class="finding-title" style="margin-top: 8px;">${issue.title}</div>
              <div class="finding-desc">${issue.description}</div>
              <div style="font-size: 10px; color: #9ca3af; font-family: monospace; margin-top: 4px;">Scope: ${issue.resourceArn}</div>
            </div>
          `).join('')}

          ${highIssues.map(issue => `
            <div class="finding-card" style="border-color: #ffedd5; background-color: #fffbf7;">
              <span style="font-size: 10px; font-weight: bold; background-color: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 4px; border: 1px solid #fed7aa;">HIGH</span>
              <div class="finding-title" style="margin-top: 8px; color: #a21caf;">${issue.title}</div>
              <div class="finding-desc">${issue.description}</div>
              <div style="font-size: 10px; color: #9ca3af; font-family: monospace; margin-top: 4px;">Scope: ${issue.resourceArn}</div>
            </div>
          `).join('')}

          <div style="text-align: center;">
            <a href="http://localhost:5173/dashboard" class="btn" style="color: #ffffff;">Launch Dashboard Console</a>
          </div>
        </div>
        <div class="footer">
          This is an automated system notification from CloudLockr CSPM daemon. Please do not reply.
        </div>
      </div>
    </body>
    </html>
  `;

  // Fallback checks if SMTP credentials are not configured in local .env
  if (!host || !user || !pass) {
    console.log('\n📧 ===== [Mailer Fallback] SMTP CREDENTIALS NOT SET. PRINTING EMULATED EMAIL ALERT =====');
    console.log(`[To]: ${receiver}`);
    console.log(`[From]: ${sender}`);
    console.log(`[Subject]: ${subject}`);
    console.log(`[Posture Score]: ${scan.score}/100`);
    console.log(`[Critical Vulnerabilities Count]: ${criticalIssues.length}`);
    console.log(`[High Vulnerabilities Count]: ${highIssues.length}`);
    console.log('=================================================================================\n');
    return;
  }

  // Create real SMTP transport connection pool
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const info = await transporter.sendMail({
      from: sender,
      to: receiver,
      subject: subject,
      html: htmlBody
    });

    console.log(`[Mailer] Security alert email dispatched successfully! MessageID: ${info.messageId}`);
  } catch (error) {
    console.error('[Mailer] SMTP delivery failed:', error.message);
  }
};
