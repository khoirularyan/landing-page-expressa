const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Detect Serverless / Vercel environment
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION);
const TMP_DIR = path.join('/tmp', 'expressa');

// Ensure local directories exist (wrapped in try-catch to prevent EROFS)
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
try {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (e) {}
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {}
try {
  if (IS_SERVERLESS && !fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
} catch (e) {}

// File paths
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin-config.json');
const DATA_FILE = path.join(__dirname, 'consultations.json');

const TMP_CONTENT_FILE = path.join(TMP_DIR, 'content.json');
const TMP_ADMIN_FILE = path.join(TMP_DIR, 'admin-config.json');
const TMP_DATA_FILE = path.join(TMP_DIR, 'consultations.json');

// Memory storage for uploads to completely eliminate EROFS on Vercel / serverless
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png|webp|svg|gif/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('Format file harus berupa gambar (PNG, JPG, JPEG, WEBP, SVG)!'));
  }
});

// Middleware with large body limit for Base64 image payloads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data caches for fast retrieval and serverless resilience
let memoryContent = null;
let memoryAdminConfig = null;
let memoryConsultations = null;

// Secret key for HMAC token signing (stateless for serverless / Vercel multi-instance environments)
const AUTH_SECRET = process.env.ADMIN_SECRET || 'expressa_cms_jwt_secret_key_2026_fixed';
if (!process.env.ADMIN_SECRET) {
  console.warn('[WARN] ADMIN_SECRET env var not set — using insecure fallback. Set ADMIN_SECRET in .env for production!');
}

function generateToken(username) {
  const payload = {
    u: username,
    iat: Date.now(),
    exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days expiration
  };
  const payloadStr = JSON.stringify(payload);
  const encodedPayload = Buffer.from(payloadStr).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(encodedPayload).digest('hex');
  return `expr.${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length === 3 && parts[0] === 'expr') {
      const encodedPayload = parts[1];
      const signature = parts[2];
      const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(encodedPayload).digest('hex');

      const sigBuf = Buffer.from(signature);
      const expectedSigBuf = Buffer.from(expectedSig);
      if (sigBuf.length === expectedSigBuf.length && crypto.timingSafeEqual(sigBuf, expectedSigBuf)) {
        const payloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
        const payload = JSON.parse(payloadStr);
        if (payload.exp && payload.exp > Date.now()) {
          return payload;
        }
      }
    }
  } catch (e) {
    // Malformed token or JSON parse error
  }
  return null;
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Sesi login telah berakhir atau tidak valid. Silakan login kembali.' });
  }
  req.user = payload;
  next();
}

// Content retrieval with serverless fallback
function getContent() {
  if (memoryContent) return memoryContent;

  if (IS_SERVERLESS) {
    try {
      if (fs.existsSync(TMP_CONTENT_FILE)) {
        memoryContent = JSON.parse(fs.readFileSync(TMP_CONTENT_FILE, 'utf8'));
        return memoryContent;
      }
    } catch (e) {}
  }

  try {
    if (fs.existsSync(CONTENT_FILE)) {
      memoryContent = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
      return memoryContent;
    }
  } catch (err) {
    console.error('Error reading content file:', err);
  }

  return {};
}

// Content saving with EROFS protection
function saveContent(data) {
  if (data && typeof data === 'object') {
    data._lastUpdated = data._lastUpdated || Date.now();
  }
  memoryContent = data;

  try {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    if (err.code === 'EROFS' || IS_SERVERLESS) {
      try {
        if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
        fs.writeFileSync(TMP_CONTENT_FILE, JSON.stringify(data, null, 2));
        console.log('[CMS] Content saved to serverless /tmp cache.');
        return true;
      } catch (tmpErr) {
        console.warn('[CMS] Warning saving to /tmp, retained in memory:', tmpErr.message);
        return true;
      }
    }
    console.error('Error saving content file:', err);
    return false;
  }
}

// Admin config retrieval with serverless fallback
function getAdminConfig() {
  if (memoryAdminConfig) return memoryAdminConfig;

  if (IS_SERVERLESS) {
    try {
      if (fs.existsSync(TMP_ADMIN_FILE)) {
        memoryAdminConfig = JSON.parse(fs.readFileSync(TMP_ADMIN_FILE, 'utf8'));
        return memoryAdminConfig;
      }
    } catch (e) {}
  }

  try {
    if (fs.existsSync(ADMIN_FILE)) {
      memoryAdminConfig = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
      return memoryAdminConfig;
    }
  } catch (err) {
    console.error('Error reading admin config:', err);
  }

  return { username: 'admin', password: 'admin123' };
}

// Admin config saving with EROFS protection
function saveAdminConfig(cfg) {
  memoryAdminConfig = cfg;

  try {
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(cfg, null, 2));
    return true;
  } catch (err) {
    if (err.code === 'EROFS' || IS_SERVERLESS) {
      try {
        if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
        fs.writeFileSync(TMP_ADMIN_FILE, JSON.stringify(cfg, null, 2));
        return true;
      } catch (tmpErr) {
        return true;
      }
    }
    return false;
  }
}

// Consultations retrieval with serverless fallback
function getConsultations() {
  if (memoryConsultations) return memoryConsultations;

  if (IS_SERVERLESS) {
    try {
      if (fs.existsSync(TMP_DATA_FILE)) {
        memoryConsultations = JSON.parse(fs.readFileSync(TMP_DATA_FILE, 'utf8'));
        return memoryConsultations;
      }
    } catch (e) {}
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      memoryConsultations = JSON.parse(data || '[]');
      return memoryConsultations;
    }
  } catch (err) {
    console.error('Error reading consultations file:', err);
  }

  return [];
}

// Consultations saving with EROFS protection
function saveAllConsultations(list) {
  memoryConsultations = list;

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
    return true;
  } catch (err) {
    if (err.code === 'EROFS' || IS_SERVERLESS) {
      try {
        if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
        fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(list, null, 2));
        return true;
      } catch (tmpErr) {
        return true;
      }
    }
    return false;
  }
}

function saveConsultation(record) {
  const list = getConsultations();
  list.unshift(record);
  saveAllConsultations(list);
}

// =============================================
// PUBLIC API ROUTES
// =============================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Expressa Landing Page & CMS',
    serverless: IS_SERVERLESS,
    timestamp: new Date().toISOString()
  });
});

// Public content endpoint
app.get('/api/content', (req, res) => {
  const content = getContent();
  res.json({
    success: true,
    data: content
  });
});

// Backward-compatible stats endpoint
app.get('/api/stats', (req, res) => {
  const content = getContent();
  if (content.stats) {
    return res.json({
      projectsCompleted: content.stats.stat1?.number || '200+',
      enterpriseClients: content.stats.stat2?.number || '50+',
      industries: content.stats.stat3?.number || '15+',
      satisfactionRate: content.stats.stat4?.number || '98%'
    });
  }
  res.json({
    projectsCompleted: '200+',
    enterpriseClients: '50+',
    industries: '15+',
    satisfactionRate: '98%'
  });
});

// Public consultation submission
app.post('/api/consultation', (req, res) => {
  const { name, email, phone, company, service, message } = req.body;

  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Nama dan Nomor WhatsApp wajib diisi.'
    });
  }

  const record = {
    id: Date.now(),
    name: name.trim(),
    email: email ? email.trim() : '-',
    phone: phone.trim(),
    company: company ? company.trim() : '-',
    service: service || 'Umum / Belum Ditentukan',
    message: message ? message.trim() : '',
    createdAt: new Date().toISOString()
  };

  saveConsultation(record);
  console.log(`[New Consultation Request] ${record.name} (${record.company || 'Personal'}) - ${record.service}`);

  res.status(201).json({
    success: true,
    message: 'Konsultasi berhasil diajukan! Tim ahli Expressa akan menghubungi Anda melalui WhatsApp/Email dalam 1x24 jam kerja.',
    data: record
  });
});

// Simple Login Endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const adminConfig = getAdminConfig();

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
  }

  if (username === adminConfig.username && password === adminConfig.password) {
    const token = generateToken(adminConfig.username);
    return res.json({
      success: true,
      message: 'Login berhasil!',
      token: token,
      user: { username: adminConfig.username }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Username atau password salah. Silakan coba lagi.'
  });
});

// =============================================
// ADMIN PROTECTED API ROUTES
// =============================================

// Check auth status
app.get('/api/admin/check-auth', authMiddleware, (req, res) => {
  const adminConfig = getAdminConfig();
  res.json({
    success: true,
    authenticated: true,
    username: adminConfig.username
  });
});

// Logout
app.post('/api/admin/logout', (req, res) => {
  res.json({ success: true, message: 'Logout berhasil.' });
});

// Change Admin Credentials
app.post('/api/admin/change-credentials', authMiddleware, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const adminConfig = getAdminConfig();

  if (currentPassword !== adminConfig.password) {
    return res.status(400).json({ success: false, message: 'Password lama tidak sesuai.' });
  }

  if (newUsername) adminConfig.username = newUsername.trim();
  if (newPassword) adminConfig.password = newPassword.trim();

  saveAdminConfig(adminConfig);
  res.json({ success: true, message: 'Kredensial admin berhasil diperbarui!' });
});

// Update Content
app.put('/api/admin/content', authMiddleware, (req, res) => {
  const newContent = req.body;
  if (!newContent || typeof newContent !== 'object') {
    return res.status(400).json({ success: false, message: 'Format data tidak valid.' });
  }

  const ok = saveContent(newContent);
  if (ok) {
    console.log('[CMS Update] Landing page content updated successfully.');
    return res.json({ success: true, message: 'Konten landing page berhasil disimpan!' });
  }
  res.status(500).json({ success: false, message: 'Gagal menyimpan konten ke sistem file.' });
});

// Upload Image - Memory buffer to Base64 (100% Serverless & Vercel friendly, zero EROFS error)
app.post('/api/admin/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada file gambar yang diunggah.' });
  }

  // Convert buffer to Data URI (Base64) so it works natively on Vercel read-only filesystem
  const base64Data = req.file.buffer.toString('base64');
  const mimeType = req.file.mimetype || 'image/png';
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  // If local environment with writable filesystem, optionally save copy to disk as well
  if (!IS_SERVERLESS) {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname).toLowerCase() || '.png';
      const filename = 'img-' + uniqueSuffix + ext;
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.file.buffer);
    } catch (e) {}
  }

  console.log(`[Upload Success] File converted to Data URI (${req.file.originalname}, ${req.file.size} bytes).`);
  res.json({
    success: true,
    message: 'Gambar berhasil diunggah!',
    url: dataUrl,
    filename: req.file.originalname
  });
}, (error, req, res, next) => {
  res.status(400).json({ success: false, message: error.message });
});

// Get Consultations for Admin
app.get('/api/admin/consultations', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: getConsultations()
  });
});

// Delete Consultation Lead
app.delete('/api/admin/consultations/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  let list = getConsultations();
  const initialLength = list.length;
  list = list.filter(item => item.id !== id);

  if (list.length !== initialLength) {
    saveAllConsultations(list);
    return res.json({ success: true, message: 'Data prospek berhasil dihapus.' });
  }
  res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
});

// =============================================
// ADMIN & STATIC PAGE ROUTING
// =============================================

// Route for /login -> public/admin/login.html
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

// Route for /portofolio & /portfolio -> public/portofolio.html
app.get(['/portofolio', '/portfolio', '/portofolio.html', '/proyek'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portofolio.html'));
});

// Route for /tim & /team -> public/tim.html
app.get(['/tim', '/team', '/tim.html', '/team.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tim.html'));
});

// Route for /galeri & /gallery -> public/galeri.html
app.get(['/galeri', '/gallery', '/galeri-project', '/gallery-project', '/galeri.html', '/gallery.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'galeri.html'));
});

// Route for /about & /about-us -> public/about.html
app.get(['/about', '/about-us', '/tentang', '/tentang-kami', '/about.html', '/about-us.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// Route for /admin -> public/admin/index.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Route for /admin/ -> public/admin/index.html
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Fallback to public/index.html for any other URL
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server with fallback port support (only in non-serverless environments)
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`=============================================`);
    console.log(` Expressa Landing Page & CMS Server Running!`);
    console.log(` Website URL: http://localhost:${port}`);
    console.log(` CMS Admin:   http://localhost:${port}/admin`);
    console.log(` CMS Login:   http://localhost:${port}/login`);
    console.log(`=============================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

if (!IS_SERVERLESS && process.env.NODE_ENV !== 'test') {
  startServer(PORT);
}

// Export app instance for Vercel Serverless Functions
module.exports = app;
