import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    companyName,
    email,
    phone,
    message,
    brand,
    partNumber
  } = req.body;

  if (!email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  // 🔒 Defensa extra (muy importante)
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.error('SMTP env vars missing');
    return res.status(500).json({
      success: false,
      message: 'Email service not configured'
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.CONTACT_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_TO || process.env.SMTP_USER,
      subject: `New contact request${brand ? ` - ${brand}` : ''}`,
      html: `
        <h2>New Contact Request</h2>
        <p><strong>Company:</strong> ${companyName || '-'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || '-'}</p>
        ${brand ? `<p><strong>Brand:</strong> ${brand}</p>` : ''}
        ${partNumber ? `<p><strong>Part Number:</strong> ${partNumber}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
}
