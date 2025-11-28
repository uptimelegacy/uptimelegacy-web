// /api/contact.js
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
  }

  try {
    const { name, company, email, phone, message } = req.body || {};

    if (!name || !company || !email || !phone || !message) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, message: 'Missing required fields' }));
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false otherwise
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const toAddress = process.env.CONTACT_TO || process.env.SMTP_USER;
    const fromAddress = process.env.CONTACT_FROM || process.env.SMTP_USER;

    const mailOptions = {
      from: fromAddress,
      to: toAddress,
      subject: `New contact from UptimeLegacy: ${name}`,
      text: `
New contact form submission:

Name: ${name}
Company: ${company}
Email: ${email}
Phone: ${phone}

Message:
${message}
      `.trim(),
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true }));
  } catch (error) {
    console.error('Error in /api/contact:', error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
  }
};
