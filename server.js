const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Multer Storage Configuration for Image Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Data Files
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin-config.json');
const DATA_FILE = path.join(__dirname, 'consultations.json');

// In-memory Auth Token Set
const activeTokens = new Set(['admin-dev-session-token']);

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
  }
  const token = authHeader.split(' ')[1];
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Sesi login telah berakhir atau tidak valid.' });
  }
  next();
}

function getContent() {
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading content file:', err);
  }
  return {};
}

function saveContent(data) {
  try {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving content file:', err);
    return false;
  }
}

function getAdminConfig() {
  try {
    if (fs.existsSync(ADMIN_FILE)) {
      return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading admin config:', err);
  }
  return { username: 'admin', password: 'admin123' };
}

function saveAdminConfig(cfg) {
  try {
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(cfg, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving admin config:', err);
    return false;
  }
}

function getConsultations() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (err) {
    console.error('Error reading consultations file:', err);
  }
  return [];
}

function saveConsultation(record) {
  try {
    const list = getConsultations();
    list.unshift(record);
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
  } catch (err) {
    console.error('Error saving consultation record:', err);
  }
}

// =============================================
// PUBLIC API ROUTES
// =============================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Expressa Landing Page & CMS',
    timestamp: new Date().toISOString()
  });
});

// Get Public Content (Landing page feeds from here)
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
    const token = 'expr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    activeTokens.add(token);
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
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeTokens.delete(token);
  }
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

// Upload Image
app.post('/api/admin/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada file gambar yang diunggah.' });
  }

  const imageUrl = '/uploads/' + req.file.filename;
  console.log(`[Upload Success] File uploaded: ${imageUrl}`);
  res.json({
    success: true,
    message: 'Gambar berhasil diunggah!',
    url: imageUrl,
    filename: req.file.filename
  });
}, (error, req, res, next) => {
  // Multer error handling
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
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
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

// Route for /admin -> public/admin/index.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Fallback to public/index.html for any other URL
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server with fallback port support
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

startServer(PORT);
