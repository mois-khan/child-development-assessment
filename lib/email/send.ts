import sgMail from '@sendgrid/mail';

interface SendReportOptions {
  to: string | string[];
  childName: string;
  pdfBuffer: Buffer;
}

export async function sendReportEmail({ to, childName, pdfBuffer }: SendReportOptions) {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  const fromEmailRaw = process.env.SENDGRID_FROM_EMAIL?.trim();

  if (!apiKey) {
    console.warn("SENDGRID_API_KEY is not set. Email will not be sent.");
    return;
  }
  
  if (!fromEmailRaw) {
    console.warn("SENDGRID_FROM_EMAIL is not set. Email will not be sent.");
    return;
  }

  // Set API key inside the function to ensure process.env is loaded
  sgMail.setApiKey(apiKey);

  // Parse "Name <email@domain.com>" format
  let fromEmail = fromEmailRaw;
  let fromName = 'Kaushalya Genius Kid Program'; // Default
  
  const match = fromEmailRaw.match(/(.*?)\s*<([^>]+)>/);
  if (match) {
    fromName = match[1].trim().replace(/^"|"$/g, ''); // Extract name and remove quotes if any
    fromEmail = match[2].trim();
  }

  const msg = {
    to,
    from: {
      email: fromEmail,
      name: fromName
    },
    subject: `Your child ${childName}'s ECCTRACTION Report is Ready!`,
    text: `Hello,\n\nWe have completed the developmental assessment for ${childName}.\n\nPlease find the detailed ECCTRACTION report attached to this email.\n\nBest regards,\n${fromName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4D1435;">ECCTRACTION Report Ready</h2>
        <p>Hello,</p>
        <p>We have completed the developmental assessment for <strong>${childName}</strong>.</p>
        <p>Please find the detailed ECCTRACTION report attached to this email as a PDF.</p>
        <br/>
        <p>Best regards,<br/><strong>${fromName}</strong></p>
      </div>
    `,
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: `${childName}_ECCTRACTION_Report.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  };

  try {
    await sgMail.send(msg);
    console.log(`Report email successfully sent to: ${Array.isArray(to) ? to.join(', ') : to}`);
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    if ((error as any).response) {
      console.error(JSON.stringify((error as any).response.body, null, 2));
    }
    throw error;
  }
}
