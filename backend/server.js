import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Groq from 'groq-sdk';
import { catalogSeedData, catalogVersion } from './catalogSeedData.js';
import { createQuizSession, evaluateQuizSession } from './quizService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.join(__dirname, '.env');

dotenv.config({ path: ENV_PATH });

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const groqClient = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

const statsSchema = new mongoose.Schema(
  {
    progressStreak: { type: Number, default: 0 },
    totalCompleted: { type: Number, default: 0 },
    totalTopics: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    lastActive: { type: String, default: null },
    completedToday: { type: Number, default: 0 },
    bookmarkedCount: { type: Number, default: 0 },
    revisionDueCount: { type: Number, default: 0 },
    sectionSummaries: { type: mongoose.Schema.Types.Mixed, default: {} },
    weeklyActivity: { type: mongoose.Schema.Types.Mixed, default: [] },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    dailyGoal: { type: Number, default: 5 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    dsaData: { type: mongoose.Schema.Types.Mixed, default: [] },
    coreData: { type: mongoose.Schema.Types.Mixed, default: {} },
    aptitudeData: { type: mongoose.Schema.Types.Mixed, default: {} },
    stats: { type: statsSchema, default: () => ({}) },
    settings: { type: settingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

const topicCatalogSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    version: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
const TopicCatalog = mongoose.model('TopicCatalog', topicCatalogSchema);

function formatStartupError(error) {
  const message = error?.message || String(error);

  if (message.includes('querySrv ECONNREFUSED')) {
    return `${message}. MongoDB Atlas SRV lookup failed, which usually means DNS or network access is blocking the _mongodb._tcp lookup. Try switching your DNS server to 8.8.8.8 or 1.1.1.1, temporarily disabling VPN/firewall filtering, or using the standard mongodb:// connection string from Atlas instead of mongodb+srv://.`;
  }

  if (message.includes('querySrv ENOTFOUND')) {
    return `${message}. The Atlas cluster hostname could not be resolved. Double-check the MONGODB_URI in ${ENV_PATH} and make sure the cluster address is copied exactly from MongoDB Atlas.`;
  }

  return message;
}

const demoJobs = [
  {
    job_id: 'demo-001',
    job_title: 'Software Engineer Intern',
    employer_name: 'Infosys',
    job_description: 'Join the InfyTQ campus hiring program. Work on enterprise software, REST APIs, and cloud deployment pipelines for Fortune 500 clients.',
    job_apply_link: 'https://career.infosys.com/jobdescription/Internship',
    job_posted_at_datetime_utc: '2026-04-20T10:00:00.000Z',
    job_employment_type: 'Internship',
    employer_logo: null,
    job_city: 'Bengaluru',
    job_state: 'Karnataka',
    job_country: 'India',
    job_match: 92,
  },
  {
    job_id: 'demo-002',
    job_title: 'Associate Software Engineer',
    employer_name: 'TCS',
    job_description: 'Campus placement role for 2025/26 graduates. Strong DSA, Java/Python, and DBMS knowledge required. 6 LPA package.',
    job_apply_link: 'https://www.tcs.com/careers/india/campus',
    job_posted_at_datetime_utc: '2026-04-18T10:00:00.000Z',
    job_employment_type: 'Full-time',
    employer_logo: null,
    job_city: 'Mumbai',
    job_state: 'Maharashtra',
    job_country: 'India',
    job_match: 88,
  },
  {
    job_id: 'demo-003',
    job_title: 'Frontend Developer',
    employer_name: 'Zomato',
    job_description: 'Build micro-frontends for Zomato\'s consumer app. Requires strong React, TypeScript, and performance optimization skills.',
    job_apply_link: 'https://www.zomato.com/careers',
    job_posted_at_datetime_utc: '2026-04-17T10:00:00.000Z',
    job_employment_type: 'Full-time',
    employer_logo: null,
    job_city: 'Gurugram',
    job_state: 'Haryana',
    job_country: 'India',
    job_match: 85,
  },
  {
    job_id: 'demo-004',
    job_title: 'Backend Engineer',
    employer_name: 'Razorpay',
    job_description: 'Work on payment infrastructure at scale. Strong Java/Go, system design, and low-latency API experience required.',
    job_apply_link: 'https://razorpay.com/jobs/',
    job_posted_at_datetime_utc: '2026-04-16T10:00:00.000Z',
    job_employment_type: 'Full-time',
    employer_logo: null,
    job_city: 'Bengaluru',
    job_state: 'Karnataka',
    job_country: 'India',
    job_match: 83,
  },
  {
    job_id: 'demo-005',
    job_title: 'Data Analyst',
    employer_name: 'Wipro',
    job_description: 'Analyze business data, build Power BI dashboards, and deliver actionable insights for global clients. SQL and Excel proficiency required.',
    job_apply_link: 'https://careers.wipro.com/',
    job_posted_at_datetime_utc: '2026-04-15T10:00:00.000Z',
    job_employment_type: 'Full-time',
    employer_logo: null,
    job_city: 'Hyderabad',
    job_state: 'Telangana',
    job_country: 'India',
    job_match: 80,
  },
  {
    job_id: 'demo-006',
    job_title: 'Graduate Trainee Engineer',
    employer_name: 'HCL Technologies',
    job_description: 'Fresher-friendly role covering software development, testing, and support. Training program included. 4.5 LPA package.',
    job_apply_link: 'https://www.hcltech.com/careers',
    job_posted_at_datetime_utc: '2026-04-14T10:00:00.000Z',
    job_employment_type: 'Full-time',
    employer_logo: null,
    job_city: 'Noida',
    job_state: 'Uttar Pradesh',
    job_country: 'India',
    job_match: 78,
  },
  {
    job_id: 'demo-007',
    job_title: 'SDE-1',
    employer_name: 'Swiggy',
    job_description: 'Join the delivery tech team building real-time order routing, ETA prediction, and last-mile delivery systems.',
    job_apply_link: 'https://careers.swiggy.com/',
    job_posted_at_datetime_utc: '2026-04-13T10:00:00.000Z',
    job_employment_type: 'Full-time',
    employer_logo: null,
    job_city: 'Bengaluru',
    job_state: 'Karnataka',
    job_country: 'India',
    job_match: 87,
  },
  {
    job_id: 'demo-008',
    job_title: 'Systems Engineer',
    employer_name: 'Cognizant',
    job_description: 'Work on enterprise application development and maintenance for global clients. Java, SQL, Agile methodology preferred.',
    job_apply_link: 'https://careers.cognizant.com/',
    job_posted_at_datetime_utc: '2026-04-12T10:00:00.000Z',
    job_employment_type: 'Full-time',
    employer_logo: null,
    job_city: 'Chennai',
    job_state: 'Tamil Nadu',
    job_country: 'India',
    job_match: 76,
  },
  {
    job_id: 'demo-009',
    job_title: 'React Developer Intern',
    employer_name: 'CRED',
    job_description: 'Build premium UI for CRED\'s finance super-app. You\'ll work with senior engineers on design systems, animations, and A/B testing.',
    job_apply_link: 'https://careers.cred.club/',
    job_posted_at_datetime_utc: '2026-04-11T10:00:00.000Z',
    job_employment_type: 'Internship',
    employer_logo: null,
    job_city: 'Bengaluru',
    job_state: 'Karnataka',
    job_country: 'India',
    job_match: 89,
  },
  {
    job_id: 'demo-010',
    job_title: 'ML Engineer',
    employer_name: 'Ola',
    job_description: 'Build ML models for driver-rider matching, surge pricing, and demand forecasting. Python, TensorFlow, and strong stats required.',
    job_apply_link: 'https://www.olacabs.com/careers',
    job_posted_at_datetime_utc: '2026-04-10T10:00:00.000Z',
    job_employment_type: 'Full-time',
    employer_logo: null,
    job_city: 'Bengaluru',
    job_state: 'Karnataka',
    job_country: 'India',
    job_match: 82,
  },
];

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function trimName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

function generateToken(user) {
  return jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function isSameDay(dateA, dateB) {
  return dateA.toDateString() === dateB.toDateString();
}

function isYesterday(previousDate, currentDate) {
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  return previousDate.toDateString() === yesterday.toDateString();
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function normalizeTaskItem(baseItem, savedItem = {}) {
  return {
    ...baseItem,
    pdf: savedItem.pdf || baseItem.pdf || '',
    resource: savedItem.resource || baseItem.resource || '',
    opened: Boolean(savedItem.opened),
    completed: Boolean(savedItem.completed),
    bookmarked: Boolean(savedItem.bookmarked),
    reviseAt: savedItem.reviseAt || null,
    completedAt: savedItem.completedAt || null,
    lastCompletedAt: savedItem.lastCompletedAt || null,
    lastOpenedAt: savedItem.lastOpenedAt || null,
  };
}

function mergeDsaData(baseData, savedData = []) {
  return baseData.map((topic) => {
    const savedTopic = savedData.find((entry) => entry.name === topic.name) || {};
    const mergedTopic = { name: topic.name };

    Object.keys(topic).forEach((key) => {
      if (key !== 'name' && Array.isArray(topic[key])) {
        mergedTopic[key] = topic[key].map((item) => {
          const savedItem = (savedTopic[key] || []).find((entry) => entry.name === item.name) || {};
          return normalizeTaskItem(item, savedItem);
        });
      }
    });

    return mergedTopic;
  });
}

function mergeGroupedData(baseData, savedData = {}) {
  return Object.fromEntries(
    Object.entries(baseData).map(([groupName, items]) => [
      groupName,
      items.map((item) => {
        const savedItem = (savedData[groupName] || []).find((entry) => entry.name === item.name) || {};
        return normalizeTaskItem(item, savedItem);
      }),
    ])
  );
}

function walkTaskItems(node, callback, context = {}) {
  if (Array.isArray(node)) {
    node.forEach((value) => walkTaskItems(value, callback, context));
    return;
  }

  if (!node || typeof node !== 'object') {
    return;
  }

  if (typeof node.name === 'string' && typeof node.completed === 'boolean') {
    callback(node, context);
    return;
  }

  Object.entries(node).forEach(([key, value]) => {
    if (Array.isArray(value) || (value && typeof value === 'object')) {
      walkTaskItems(value, callback, { ...context, parentKey: key });
    }
  });
}

function buildSectionSummary(label, data) {
  let total = 0;
  let completed = 0;

  walkTaskItems(data, (item) => {
    total += 1;
    if (item.completed) {
      completed += 1;
    }
  });

  return {
    label,
    total,
    completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function buildWeeklyActivity(allSections) {
  const start = startOfToday();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() - (6 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count: 0,
    };
  });

  const dayIndex = new Map(days.map((day, index) => [day.key, index]));

  allSections.forEach((section) => {
    walkTaskItems(section, (item) => {
      const dateValue = item.lastCompletedAt || item.completedAt;
      if (!dateValue) {
        return;
      }

      const key = new Date(dateValue).toISOString().slice(0, 10);
      if (dayIndex.has(key)) {
        days[dayIndex.get(key)].count += 1;
      }
    });
  });

  return days;
}

function buildRecommendations(allSections) {
  const now = Date.now();
  const recommendations = [];
  const revisionQueue = [];
  const bookmarks = [];

  const pushTask = (bucket, item, sectionLabel) => {
    bucket.push({
      name: item.name,
      section: sectionLabel,
      bookmarked: Boolean(item.bookmarked),
      reviseAt: item.reviseAt,
      completed: item.completed,
    });
  };

  [
    ['DSA', allSections[0]],
    ['Core', allSections[1]],
    ['Aptitude', allSections[2]],
  ].forEach(([sectionLabel, sectionData]) => {
    walkTaskItems(sectionData, (item) => {
      const dueRevision = item.reviseAt && new Date(item.reviseAt).getTime() <= now;

      if (item.bookmarked) {
        pushTask(bookmarks, item, sectionLabel);
      }

      if (dueRevision) {
        pushTask(revisionQueue, item, sectionLabel);
      }

      if (!item.completed || dueRevision || item.bookmarked) {
        pushTask(recommendations, item, sectionLabel);
      }
    });
  });

  return {
    recommendedTasks: recommendations.slice(0, 6),
    revisionQueue: revisionQueue.slice(0, 6),
    bookmarks: bookmarks.slice(0, 6),
  };
}

function buildStats({ dsaData, coreData, aptitudeData }, previousStats = {}, updateActivity = false) {
  const now = new Date();
  const today = startOfToday();
  const sections = [
    buildSectionSummary('DSA', dsaData),
    buildSectionSummary('Core', coreData),
    buildSectionSummary('Aptitude', aptitudeData),
  ];
  const totalTopics = sections.reduce((sum, section) => sum + section.total, 0);
  const totalCompleted = sections.reduce((sum, section) => sum + section.completed, 0);
  const completionRate = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;

  let completedToday = 0;
  let bookmarkedCount = 0;
  let revisionDueCount = 0;

  [dsaData, coreData, aptitudeData].forEach((section) => {
    walkTaskItems(section, (item) => {
      if (item.bookmarked) {
        bookmarkedCount += 1;
      }

      if (item.reviseAt && new Date(item.reviseAt).getTime() <= now.getTime()) {
        revisionDueCount += 1;
      }

      const completionStamp = item.lastCompletedAt || item.completedAt;
      if (completionStamp && new Date(completionStamp) >= today) {
        completedToday += 1;
      }
    });
  });

  let progressStreak = previousStats.progressStreak || 0;
  let lastActive = previousStats.lastActive || null;

  if (updateActivity) {
    const previousDate = lastActive ? new Date(lastActive) : null;

    if (!previousDate || Number.isNaN(previousDate.getTime())) {
      progressStreak = 1;
    } else if (isSameDay(previousDate, now)) {
      progressStreak = progressStreak || 1;
    } else if (isYesterday(previousDate, now)) {
      progressStreak += 1;
    } else {
      progressStreak = 1;
    }

    lastActive = now.toISOString();
  }

  let accuracyNumerator = 0;
  let accuracyDenominator = 0;

  [dsaData, coreData, aptitudeData].forEach((section) => {
    walkTaskItems(section, (item) => {
      if (item.completed) {
        accuracyDenominator += 1;
        if (item.opened || item.lastOpenedAt) {
          accuracyNumerator += 1;
        }
      }
    });
  });

  const accuracy = accuracyDenominator > 0 ? Math.round((accuracyNumerator / accuracyDenominator) * 100) : 0;

  return {
    progressStreak,
    totalCompleted,
    totalTopics,
    completionRate,
    accuracy,
    lastActive,
    completedToday,
    bookmarkedCount,
    revisionDueCount,
    sectionSummaries: Object.fromEntries(sections.map((section) => [section.label, section])),
    weeklyActivity: buildWeeklyActivity([dsaData, coreData, aptitudeData]),
  };
}

function sanitizeUser(user) {
  const dsaData = user.dsaData || [];
  const coreData = user.coreData || {};
  const aptitudeData = user.aptitudeData || {};
  const insights = buildRecommendations([dsaData, coreData, aptitudeData]);

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    dsaData,
    coreData,
    aptitudeData,
    stats: user.stats || buildStats({ dsaData, coreData, aptitudeData }),
    settings: user.settings || { dailyGoal: 5 },
    insights,
  };
}

function generateChatReply(question = '') {
  const normalizedQuestion = question.toLowerCase();

  if (normalizedQuestion.includes('dsa')) {
    return 'Focus on arrays, linked lists, trees, graphs, and daily problem solving. Aim for consistency over volume.';
  }

  if (normalizedQuestion.includes('aptitude')) {
    return 'For aptitude, practice percentages, time and work, reasoning puzzles, and verbal accuracy in timed sessions.';
  }

  if (
    normalizedQuestion.includes('core') ||
    normalizedQuestion.includes('os') ||
    normalizedQuestion.includes('dbms')
  ) {
    return 'Prioritize OOPS, DBMS, OS, networks, and system design fundamentals. Revise definitions first, then common interview questions.';
  }

  if (normalizedQuestion.includes('resume') || normalizedQuestion.includes('interview')) {
    return 'Keep your resume impact-focused and be ready with project explanations, tradeoffs, and debugging stories for interviews.';
  }

  return 'Build a balanced routine: revise one concept, solve one problem, and reflect on one weak area each day. Ask me about DSA, aptitude, core subjects, or interviews.';
}

function filterJobs({ description = '', city = '', state = '', country = '' }) {
  const normalizedDescription = description.toLowerCase();
  const normalizedCity = city.toLowerCase();
  const normalizedState = state.toLowerCase();
  const normalizedCountry = country.toLowerCase();

  return demoJobs.filter((job) => {
    const matchesDescription =
      !normalizedDescription ||
      job.job_title.toLowerCase().includes(normalizedDescription) ||
      job.job_description.toLowerCase().includes(normalizedDescription);
    const matchesCity = !normalizedCity || (job.job_city || '').toLowerCase().includes(normalizedCity);
    const matchesState = !normalizedState || (job.job_state || '').toLowerCase().includes(normalizedState);
    const matchesCountry =
      !normalizedCountry || (job.job_country || '').toLowerCase().includes(normalizedCountry);

    return matchesDescription && matchesCity && matchesState && matchesCountry;
  });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = payload;
    next();
  });
}

async function ensureTopicCatalog() {
  const entries = Object.entries(catalogSeedData);

  await Promise.all(
    entries.map(async ([key, data]) => {
      const existing = await TopicCatalog.findOne({ key });
      if (!existing || existing.version !== catalogVersion) {
        await TopicCatalog.findOneAndUpdate(
          { key },
          { key, version: catalogVersion, data: cloneData(data) },
          { upsert: true, returnDocument: 'after' }
        );
      }
    })
  );
}

async function getCatalogMap() {
  const docs = await TopicCatalog.find({});

  return docs.reduce((acc, doc) => {
    acc[doc.key] = cloneData(doc.data);
    return acc;
  }, {});
}

async function hydrateUserProgress(user) {
  const catalog = await getCatalogMap();
  const nextDsa = mergeDsaData(catalog.dsaData || [], user.dsaData || []);
  const nextCore = mergeGroupedData(catalog.coreData || {}, user.coreData || {});
  const nextAptitude = mergeGroupedData(catalog.aptitudeData || {}, user.aptitudeData || {});

  const hasChanged =
    JSON.stringify(user.dsaData || []) !== JSON.stringify(nextDsa) ||
    JSON.stringify(user.coreData || {}) !== JSON.stringify(nextCore) ||
    JSON.stringify(user.aptitudeData || {}) !== JSON.stringify(nextAptitude);

  if (hasChanged) {
    user.dsaData = nextDsa;
    user.coreData = nextCore;
    user.aptitudeData = nextAptitude;
  }

  user.stats = buildStats(
    { dsaData: user.dsaData, coreData: user.coreData, aptitudeData: user.aptitudeData },
    user.stats || {},
    false
  );

  return { user, catalog, hasChanged };
}

app.get('/', (_req, res) => {
  res.json({ message: 'Backend is running!' });
});

app.get('/health', (_req, res) => {
  const mongoState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ ok: true, mongo: mongoState });
});

app.get('/catalog', authenticateToken, async (_req, res) => {
  try {
    const catalog = await getCatalogMap();
    res.json(catalog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/register', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  const cleanName = trimName(name);

  if (!cleanName || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Name, email, password and confirm password are required' });
  }

  if (cleanName.length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters long' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters and include letters and numbers' });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const catalog = await getCatalogMap();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const dsaData = mergeDsaData(catalog.dsaData || [], []);
    const coreData = mergeGroupedData(catalog.coreData || {}, {});
    const aptitudeData = mergeGroupedData(catalog.aptitudeData || {}, {});
    const user = await User.create({
      name: cleanName,
      email,
      password: hashedPassword,
      dsaData,
      coreData,
      aptitudeData,
      stats: buildStats({ dsaData, coreData, aptitudeData }),
      settings: { dailyGoal: 5 },
    });

    const token = generateToken(user);
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await hydrateUserProgress(user);
    await user.save();

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/logout', (_req, res) => {
  res.json({ message: 'Logout successful' });
});

app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { hasChanged } = await hydrateUserProgress(user);
    if (hasChanged) {
      await user.save();
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/progress/:section', authenticateToken, async (req, res) => {
  const { section } = req.params;
  const { data, updateActivity = true } = req.body;
  const allowedSections = new Set(['dsaData', 'coreData', 'aptitudeData']);

  if (!allowedSections.has(section)) {
    return res.status(400).json({ error: 'Invalid progress section' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const catalog = await getCatalogMap();
    user[section] =
      section === 'dsaData'
        ? mergeDsaData(catalog.dsaData || [], data || [])
        : mergeGroupedData(catalog[section] || {}, data || {});

    user.stats = buildStats(
      {
        dsaData: section === 'dsaData' ? user.dsaData : user.dsaData || [],
        coreData: section === 'coreData' ? user.coreData : user.coreData || {},
        aptitudeData: section === 'aptitudeData' ? user.aptitudeData : user.aptitudeData || {},
      },
      user.stats || {},
      Boolean(updateActivity)
    );

    await user.save();

    res.json({
      message: `${section} updated successfully`,
      user: sanitizeUser(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/settings', authenticateToken, async (req, res) => {
  const { dailyGoal } = req.body;

  if (dailyGoal !== undefined && (!Number.isInteger(dailyGoal) || dailyGoal < 1 || dailyGoal > 50)) {
    return res.status(400).json({ error: 'Daily goal must be an integer between 1 and 50' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.settings = {
      ...(user.settings?.toObject?.() || user.settings || {}),
      ...(dailyGoal !== undefined ? { dailyGoal } : {}),
    };

    await user.save();

    res.json({
      message: 'Settings updated successfully',
      user: sanitizeUser(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/topics', authenticateToken, async (_req, res) => {
  try {
    const catalog = await getCatalogMap();
    res.json({
      dsa: Object.keys(catalog.dsaData || {}).length ? catalog.dsaData : [],
      core: catalog.coreData || {},
      aptitude: catalog.aptitudeData || {},
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/chat', authenticateToken, async (req, res) => {
  const { question } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  // ── Fallback if Groq key is not configured ────────────────────────────────
  if (!groqClient) {
    return res.json({ reply: generateChatReply(question) });
  }

  try {
    const user = await User.findById(req.user.id).lean();
    const completionRate = user?.stats?.completionRate || 0;
    const streak = user?.stats?.progressStreak || 0;

    const completion = await groqClient.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: `You are a helpful placement preparation assistant for college students in India.
The student's overall completion rate is ${completionRate}% and they have a ${streak}-day study streak.
Help with DSA, Core CS subjects (OS, DBMS, Networks, OOPS), aptitude, resume tips, and interview prep.
Keep responses concise and actionable. Use bullet points when listing steps or multiple items.`,
        },
        {
          role: 'user',
          content: question.trim(),
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content || 'No response received.';
    res.json({ reply });
  } catch (err) {
    console.error('Groq API error:', err.message);
    res.json({ reply: generateChatReply(question) });
  }
});

app.post('/api/quiz/generate', authenticateToken, async (req, res) => {
  const { subject, topic, difficulty, questionCount } = req.body || {};

  if (!subject || !topic || !difficulty || !questionCount) {
    return res.status(400).json({ error: 'Subject, topic, difficulty, and question count are required.' });
  }

  try {
    const payload = await createQuizSession({
      subject,
      topic,
      difficulty,
      questionCount,
      groqClient,
    });

    res.json(payload);
  } catch (error) {
    console.error('Quiz generation error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate quiz questions.' });
  }
});

app.post('/api/quiz/evaluate', authenticateToken, async (req, res) => {
  const { sessionId, answers } = req.body || {};

  if (!sessionId) {
    return res.status(400).json({ error: 'Quiz session is missing.' });
  }

  try {
    const result = await evaluateQuizSession({
      sessionId,
      answers,
      groqClient,
    });

    res.json(result);
  } catch (error) {
    console.error('Quiz evaluation error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to evaluate the quiz.' });
  }
});

app.post('/search', authenticateToken, async (req, res) => {
  const { description = 'software engineer', city = '', state = '', country = '' } = req.body;

  // ── Enforce 60% gate on the backend (frontend lock can be bypassed) ────────
  try {
    const user = await User.findById(req.user.id).lean();
    const completionRate = user?.stats?.completionRate || 0;

    if (completionRate < 60) {
      // Below threshold — return demo Indian jobs only, filter by search term
      const jobs = filterJobs(req.body || {});
      return res.json({
        jobs: jobs.length > 0 ? jobs : demoJobs,
        demo: true,
        message: `Complete ${60 - Math.round(completionRate)}% more to unlock real job listings.`,
      });
    }
  } catch (_err) {
    // If user lookup fails, fall through to demo jobs for safety
    return res.json({ jobs: demoJobs, demo: true });
  }

  // ── User has >= 60% — fetch real jobs from JSearch ────────────────────────
  if (!RAPIDAPI_KEY) {
    return res.json({ jobs: demoJobs, demo: true });
  }

  try {
    const query = [description, city || state || country || 'India'].filter(Boolean).join(' in ');
    const url = new URL('https://jsearch.p.rapidapi.com/search');
    url.searchParams.set('query', query);
    url.searchParams.set('page', '1');
    url.searchParams.set('num_pages', '2');
    url.searchParams.set('date_posted', 'all');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`JSearch error: ${response.status}`);
    }

    const data = await response.json();
    const jobs = (data.data || []).map((job) => ({
      job_id: job.job_id,
      job_title: job.job_title,
      employer_name: job.employer_name,
      employer_logo: job.employer_logo || null,
      job_description: job.job_description?.slice(0, 300) + '...',
      job_apply_link: job.job_apply_link,
      job_posted_at_datetime_utc: job.job_posted_at_datetime_utc,
      job_employment_type: job.job_employment_type,
      job_city: job.job_city,
      job_state: job.job_state,
      job_country: job.job_country,
      job_match: Math.floor(70 + Math.random() * 25),
    }));

    res.json({ jobs, demo: false });
  } catch (err) {
    console.error('JSearch error:', err.message);
    const jobs = filterJobs(req.body || {});
    res.json({ jobs: jobs.length > 0 ? jobs : demoJobs, demo: true });
  }
});


async function startServer() {
  if (!MONGODB_URI) {
    throw new Error(`MONGODB_URI is missing. Add it to ${ENV_PATH} before starting the server.`);
  }

  if (!JWT_SECRET) {
    throw new Error(`JWT_SECRET is missing. Add it to ${ENV_PATH} before starting the server.`);
  }

  await mongoose.connect(MONGODB_URI);
  await ensureTopicCatalog();

  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', formatStartupError(error));
  process.exit(1);
});
