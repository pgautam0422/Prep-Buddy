# Prep Buddy – Placement Preparation Platform

Prep Buddy is a full-stack placement preparation platform for students who want to strengthen DSA, core CS fundamentals, aptitude, resume quality, and interview readiness in one place. It combines structured learning progress with AI-powered practice, job discovery, and personalized support.

## Features

- Dashboard: Tracks overall preparation progress, completed topics, and study momentum across major learning sections.
- DSA Preparation: Covers topic-wise data structures and algorithms practice with progress tracking.
- Core Subjects: Includes structured learning and tracking for DBMS, Operating Systems, Computer Networks, and OOPS.
- Aptitude: Supports quantitative and logical preparation with section-wise topic tracking.
- Practice: AI-generated MCQ tests using Groq with subject, topic, difficulty, timer, auto-submit, score evaluation, and retake flow.
- Job Discovery: Helps users search for opportunities, with real listings unlocked after the backend completion gate.
- Resume Analyzer: Reviews uploaded or pasted resumes against a target role using PDF parsing and scoring logic.
- AI Chatbot: Answers placement and study questions using Groq-powered conversational support.
- Authentication: Includes signup, login, logout, protected routes, and JWT-based session handling.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion, React Router |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| AI Integration | Groq SDK (`openai/gpt-oss-20b`) |
| Deployment | Vercel frontend, separate Express backend hosting |

## Project Structure

```text
Prep-Buddy/
├── README.md
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
├── src/
│   ├── App.jsx
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── lib/
│   └── pages/
├── backend/
│   ├── catalogSeedData.js
│   ├── package.json
│   ├── quizService.js
│   └── server.js
└── .env
```

## Installation & Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Prep-Buddy
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
4. Configure environment variables:
   - Root `.env` for frontend:
     ```env
     VITE_API_URL=http://localhost:3000
     ```
   - `backend/.env` for backend:
     ```env
     MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>
     JWT_SECRET=your_long_random_secret
     FRONTEND_URL=http://localhost:5173
     GROQ_API_KEY=your_groq_api_key
     RAPIDAPI_KEY=your_rapidapi_key
     ```
5. Start the backend:
   ```bash
   cd backend
   npm start
   ```
6. Start the frontend:
   ```bash
   cd ..
   npm run dev
   ```
   The app runs on `http://localhost:5173` and the backend listens on `http://localhost:3000` by default.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Frontend base URL for the Express API |
| `MONGODB_URI` | MongoDB connection string used by the backend |
| `JWT_SECRET` | Secret used to sign and verify JWT tokens |
| `FRONTEND_URL` | Frontend origin used by the backend configuration |
| `GROQ_API_KEY` | API key for Groq-powered chatbot and quiz features |
| `RAPIDAPI_KEY` | Key used for JSearch job-search requests |
| `PORT` | Optional backend port override; defaults to `3000` |

## API Overview

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| `GET` | `/health` | Backend health and MongoDB status | No |
| `POST` | `/register` | Create a new user and return a JWT | No |
| `POST` | `/login` | Authenticate a user | No |
| `GET` | `/profile` | Get authenticated user data | Yes |
| `GET` | `/catalog` | Fetch topic catalog data | Yes |
| `GET` | `/topics` | Fetch DSA, core, and aptitude topics | Yes |
| `PUT` | `/progress/:section` | Update learning progress | Yes |
| `PATCH` | `/settings` | Update user settings | Yes |
| `POST` | `/chat` | Ask the AI placement assistant a question | Yes |
| `POST` | `/api/quiz/generate` | Generate a practice-test session | Yes |
| `POST` | `/api/quiz/evaluate` | Evaluate quiz answers and return scores | Yes |
| `POST` | `/search` | Search for jobs, with demo fallback below the completion gate | Yes |

## Deployment

The frontend is configured for Vercel using `vercel.json` for SPA routing. The backend is a standalone Express service designed to run separately, typically on Render or another Node hosting platform.

## Future Enhancements

- More advanced analytics and historical performance dashboards.
- Expanded DSA, core, and aptitude question banks.
- Improved resume analysis and ATS-style job-fit scoring.
- Smarter daily revision reminders and personalized study recommendations.

## Author / Contributors

The repository currently reflects the implementation present in this codebase. No additional contributor metadata was found in the project files beyond the existing repository ownership and implementation details.
