import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import net from 'node:net';
import { createServer as createViteServer } from 'vite';
import { getDb } from './src/server/db.ts';
import { sendEmailService, getSmtpStatus } from './src/server/email.ts';

dotenv.config();

const app = express();
const PORT = 3000;

const isPortInUse = (port: number) => new Promise<boolean>((resolve) => {
  const probe = net.createConnection({ host: '127.0.0.1', port });
  probe.once('connect', () => {
    probe.destroy();
    resolve(true);
  });
  probe.once('error', () => resolve(false));
});

app.use(express.json({ limit: '10mb' }));

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SMTP Status
app.get('/api/admin/smtp-status', (req, res) => {
  try {
    const status = getSmtpStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const db = await getDb();
    if (process.env.ADMIN_EMAIL?.trim()) {
      await db.query(
        `UPDATE users
         SET role = CASE WHEN LOWER(email) = LOWER($1) THEN 'admin' ELSE 'user' END`,
        [process.env.ADMIN_EMAIL.trim()],
      );
    }
    const result = await db.query('SELECT id, name, email, role, created_at, profile_image_url FROM users ORDER BY id ASC');
    const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@ifound.org';
    const users = result.rows.map((user: any) => ({
      ...user,
      role: String(user.email).trim().toLowerCase() === configuredAdmin ? 'admin' : user.role,
    }));
    if (!users.some((user: any) => String(user.email).trim().toLowerCase() === configuredAdmin)) {
      users.push({
        id: 0,
        name: process.env.MAIL_SENDER_NAME || 'Admin',
        email: configuredAdmin,
        role: 'admin',
        created_at: new Date().toISOString(),
      });
    }
    res.json(users);
  } catch (err: any) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Save a user's profile photo as a data URL for the user's uploads and admin reports.
app.patch('/api/users/:id/profile-photo', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const profileImageUrl = typeof req.body?.profile_image_url === 'string'
      ? req.body.profile_image_url.trim()
      : '';
    if (!Number.isInteger(userId) || userId <= 0 || !profileImageUrl.startsWith('data:image/')) {
      return res.status(400).json({ error: 'A valid image file is required.' });
    }
    if (profileImageUrl.length > 4_000_000) {
      return res.status(413).json({ error: 'Profile photo must be smaller than 3 MB.' });
    }

    const db = await getDb();
    const result = await db.query(
      'UPDATE users SET profile_image_url = $1 WHERE id = $2 RETURNING id, name, email, role, created_at, profile_image_url',
      [profileImageUrl, userId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error saving profile photo:', err);
    res.status(500).json({ error: 'Failed to save profile photo.' });
  }
});

// Register new user account
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required for registration.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const db = await getDb();
    const existing = await db.query('SELECT id, name, email, role FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
    }

    // Public registration only creates standard campus member accounts
    const assignedRole = 'user';
    const result = await db.query(
      `INSERT INTO users (name, email, role, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), cleanEmail, assignedRole, password || 'default123']
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// Get all items / reports with reporter details joined from PostgreSQL
app.get('/api/reports', async (req, res) => {
  try {
    const db = await getDb();
    const query = `
      SELECT 
        i.id,
        i.user_id,
        COALESCE(i.contact_name, u.name) as reporter_name,
        COALESCE(i.contact_email, u.email) as reporter_email,
        u.profile_image_url as reporter_avatar,
        i.item_name,
        i.category,
        i.type,
        i.location,
        i.date_reported,
        i.description,
        i.status,
        i.image_url
      FROM items i
      JOIN users u ON i.user_id = u.id
      ORDER BY i.date_reported DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports from PostgreSQL' });
  }
});

// Get single report
app.get('/api/reports/:id', async (req, res) => {
  try {
    const db = await getDb();
    const query = `
      SELECT 
        i.id,
        i.user_id,
        COALESCE(i.contact_name, u.name) as reporter_name,
        COALESCE(i.contact_email, u.email) as reporter_email,
        u.profile_image_url as reporter_avatar,
        i.item_name,
        i.category,
        i.type,
        i.location,
        i.date_reported,
        i.description,
        i.status,
        i.image_url
      FROM items i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = $1
    `;
    const result = await db.query(query, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error fetching report:', err);
    res.status(500).json({ error: 'Failed to fetch report from PostgreSQL' });
  }
});

// Delete a report owned by the requesting user
app.delete('/api/reports/:id', async (req, res) => {
  try {
    const userId = Number(req.body?.user_id || req.query.user_id);
    const adminId = Number(req.body?.admin_id || req.query.admin_id);
    if ((!Number.isInteger(userId) || userId <= 0) && (!Number.isInteger(adminId) || adminId <= 0)) {
      return res.status(400).json({ error: 'A valid user_id or admin_id is required.' });
    }

    const db = await getDb();
    let report;
    if (adminId > 0) {
      const admin = await db.query('SELECT id FROM users WHERE id = $1 AND role = $2', [adminId, 'admin']);
      if (admin.rows.length === 0) {
        return res.status(403).json({ error: 'Administrator access is required.' });
      }
      report = await db.query('SELECT id FROM items WHERE id = $1', [req.params.id]);
    } else {
      report = await db.query('SELECT id FROM items WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
    }
    if (report.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    await db.query('DELETE FROM email_logs WHERE item_id = $1', [req.params.id]);
    await db.query('DELETE FROM items WHERE id = $1', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    console.error('Error deleting report:', err);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Update a report status as an administrator
app.patch('/api/reports/:id/status', async (req, res) => {
  try {
    const adminId = Number(req.body?.admin_id);
    const status = req.body?.status;
    if (!Number.isInteger(adminId) || adminId <= 0 || !['Open', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'A valid admin_id and status are required.' });
    }

    const db = await getDb();
    const admin = await db.query('SELECT id FROM users WHERE id = $1 AND role = $2', [adminId, 'admin']);
    if (admin.rows.length === 0) {
      return res.status(403).json({ error: 'Administrator access is required.' });
    }

    const result = await db.query(
      `UPDATE items
       SET status = $1, type = CASE WHEN $1 = 'Resolved' THEN 'Found' ELSE type END
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error updating report status:', err);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// Create new report
app.post('/api/reports', async (req, res) => {
  try {
    const { user_id, reporter_name, reporter_email, item_name, category, type, location, description, image_url } = req.body;
    if (!item_name || !type || !location) {
      return res.status(400).json({ error: 'Missing required report fields' });
    }

    const db = await getDb();
    let finalUserId = user_id;

    // If an email was provided in the report form, make sure it is linked or registered
    if (reporter_email) {
      const cleanEmail = reporter_email.trim().toLowerCase();
      const existingUser = await db.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (existingUser.rows.length > 0) {
        finalUserId = (existingUser.rows[0] as any).id;
      } else {
        // Create user record for this reporter so they have a registered account
        const newUser = await db.query(
          `INSERT INTO users (name, email, role) VALUES ($1, $2, 'user') RETURNING id`,
          [reporter_name ? reporter_name.trim() : 'Campus Reporter', cleanEmail]
        );
        finalUserId = (newUser.rows[0] as any).id;
      }
    }

    const reportId = `RPT-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = await db.query(
      `INSERT INTO items (id, user_id, item_name, category, type, location, description, image_url, contact_name, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        reportId,
        finalUserId || 2,
        item_name,
        category || 'General',
        type,
        location,
        description || '',
        image_url || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=400&q=80',
        reporter_name ? reporter_name.trim() : null,
        reporter_email ? reporter_email.trim() : null,
      ]
    );

    let adminNotification: { success: boolean; mode?: string; error?: string } | null = null;
    if (type === 'Found') {
      const notification = await sendEmailService({
        to: 'armandolegada12345@gmail.com',
        subject: `Found item reported: ${item_name} [${reportId}]`,
        text: `A found item was reported by ${reporter_name || 'Campus Reporter'} (${reporter_email || 'no email provided'}).

Item: ${item_name}
Category: ${category || 'General'}
Location: ${location}
Report ID: ${reportId}

Message from reporter:
${description || 'No message provided.'}

Image reference:
${image_url || 'No image provided.'}`,
        adminName: reporter_name || 'Campus Reporter',
      });
      adminNotification = {
        success: notification.success,
        mode: notification.mode,
        error: notification.error,
      };
    }

    res.status(201).json({
      ...result.rows[0],
      adminNotification,
    });
  } catch (err: any) {
    console.error('Error creating report:', err);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Get email history / logs from PostgreSQL
app.get('/api/admin/email-logs', async (req, res) => {
  try {
    const db = await getDb();
    const query = `
      SELECT 
        el.id,
        el.admin_id,
        el.admin_name,
        el.user_id,
        el.item_id,
        el.recipient_email,
        el.subject,
        el.message,
        el.status,
        el.error_message,
        el.sent_at,
        i.item_name,
        i.type as item_type
      FROM email_logs el
      LEFT JOIN items i ON el.item_id = i.id
      ORDER BY el.sent_at DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching email logs:', err);
    res.status(500).json({ error: 'Failed to fetch email logs from PostgreSQL' });
  }
});

// Core API: Admin Contact User by Email
// POST /api/admin/email-user
app.post('/api/admin/email-user', async (req, res) => {
  try {
    const { admin_id, user_id, item_id, subject, message, mark_found } = req.body;

    if (!admin_id || !user_id || !item_id || !subject || !message) {
      return res.status(400).json({ error: 'Missing required parameters (admin_id, user_id, item_id, subject, message).' });
    }

    const db = await getDb();

    if (process.env.ADMIN_EMAIL?.trim()) {
      await db.query(
        `UPDATE users
         SET role = CASE WHEN LOWER(email) = LOWER($1) THEN 'admin' ELSE 'user' END`,
        [process.env.ADMIN_EMAIL.trim()],
      );
    }

    // 1. Verify that the current user is an administrator
    const adminQuery = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [admin_id]);
    if (adminQuery.rows.length === 0) {
      return res.status(403).json({ error: 'Admin user not found.' });
    }
    const adminUser = adminQuery.rows[0] as any;
    const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@ifound.org';
    const isConfiguredAdmin = adminUser.email.toLowerCase() === configuredAdmin;
    if (adminUser.role !== 'admin' && !isConfiguredAdmin) {
      return res.status(403).json({ error: 'Access denied. User is not an administrator.' });
    }

    // 2. Retrieve the user's registered email from PostgreSQL
    const userQuery = await db.query('SELECT id, name, email FROM users WHERE id = $1', [user_id]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Reporter user not found in database.' });
    }
    const targetUser = userQuery.rows[0] as any;
    const recipientEmail = targetUser.email;

    // 3. Validate the email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({ error: `Invalid recipient email address format: ${recipientEmail}` });
    }

    // Verify item exists
    const itemQuery = await db.query('SELECT id, item_name, type FROM items WHERE id = $1', [item_id]);
    if (itemQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Referenced report item does not exist.' });
    }

    // 4. Send the email using Nodemailer/SMTP
    const sendResult = await sendEmailService({
      to: recipientEmail,
      subject: subject.trim(),
      text: message.trim(),
      adminName: adminUser.name,
    });

    const status = sendResult.success ? 'Sent' : 'Failed';
    const errorMessage = sendResult.error || null;

    // 5. Record the email activity in PostgreSQL email_logs table
    const logResult = await db.query(
      `INSERT INTO email_logs (
        admin_id, admin_name, user_id, item_id, recipient_email, subject, message, status, error_message, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        adminUser.id,
        adminUser.name,
        targetUser.id,
        item_id,
        recipientEmail,
        subject.trim(),
        message.trim(),
        status,
        errorMessage,
      ]
    );

    const savedLog = logResult.rows[0];

    const reportStatus = mark_found === true ? 'Resolved' : 'Open';
    const reportType = mark_found === true ? 'Found' : undefined;
    if (sendResult.success) {
      const updatedReport = await db.query(
        `UPDATE items
         SET status = $1, type = COALESCE($2, type)
         WHERE id = $3
         RETURNING *`,
        [reportStatus, reportType, item_id],
      );
      if (updatedReport.rows.length === 0) {
        return res.status(404).json({ error: 'Referenced report item does not exist.' });
      }
    }

    // 6. Return a success or error response to React
    if (sendResult.success) {
      return res.status(200).json({
        success: true,
        message: 'Email sent successfully.',
        log: savedLog,
        deliveryMode: sendResult.mode,
        reportStatus,
        reportType,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Unable to send email. Please try again.',
        details: errorMessage,
        log: savedLog,
      });
    }
  } catch (err: any) {
    console.error('Fatal error in /api/admin/email-user:', err);
    return res.status(500).json({
      success: false,
      error: 'Unable to send email. Please try again.',
      details: err.message,
    });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (await isPortInUse(PORT)) {
    console.log(`Development server is already running at http://localhost:${PORT}`);
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} is already in use. The existing development server is still available.`);
      server.close();
      return;
    }
    throw error;
  });
}

startServer();
