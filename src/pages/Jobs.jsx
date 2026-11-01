import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JobCard from '../components/JobCard';
import lockIcon from '../assets/icons/lock.svg';
import { locationData, countries, countryCodeMap } from '../data/locationData';
import { searchJobs } from '../lib/api';
import { useProfile } from '../context/ProfileContext';


// ─── Mic Icon ─────────────────────────────────────────────────────────────────
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Jobs = () => {
  const [progress, setProgress] = useState(0);
  const [unlocked, setUnlocked] = useState(false);

  const [jobDescription, setJobDescription] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [isDemoPreview, setIsDemoPreview] = useState(false);

  const searchTimeoutRef = useRef(null);

  const { profile: contextProfile } = useProfile();

  // Derive unlock state from shared profile context — no extra API call needed
  useEffect(() => {
    if (!contextProfile) return;
    const completionRate = contextProfile.stats?.completionRate || 0;
    setProgress(completionRate);
    setUnlocked(completionRate >= 60);
  }, [contextProfile]);

  // ── Cascade resets ──
  useEffect(() => { setSelectedState(''); setSelectedCity(''); }, [selectedCountry]);
  useEffect(() => { setSelectedCity(''); }, [selectedState]);

  const getStates = () => selectedCountry ? Object.keys(locationData[selectedCountry] || {}) : [];
  const getCities = () => (selectedCountry && selectedState) ? locationData[selectedCountry]?.[selectedState] || [] : [];

  // ── fetchJobs (debounced, uses shared apiRequest utility) ──
  const fetchJobs = (filters) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const body = {
          description: filters.jobDescription?.trim() || 'software engineer',
          city: filters.city || '',
          state: filters.state || '',
          country: countryCodeMap[filters.country] || 'in',
          date_posted: 'all',
        };

        const data = await searchJobs(body);
        const jobsList = Array.isArray(data) ? data : (data.results || data.jobs || data.data || []);
        setJobs(jobsList);
      } catch (err) {
        console.error('❌ Job fetch error:', err.message);
        setError(err.message);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // ── Single handler for both locked (demo) and unlocked search ──
  const handleSearch = (e) => {
    e?.preventDefault();
    setSearched(true);
    fetchJobs({
      jobDescription,
      country: selectedCountry,
      state: selectedState,
      city: selectedCity,
    });
  };

  const selectClass = "w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    >
      {/* ── Header ── */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mb-8 sm:mb-12"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
          💼 Discover Job Opportunities
        </h1>
        <p className="text-gray-400 text-base sm:text-lg">Find your perfect role from top companies worldwide</p>
      </motion.div>

      {/* ══════════════════════════════════════
          LOCKED STATE
      ══════════════════════════════════════ */}
      {!unlocked ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Lock card */}
          <div className="glass-card glass-hover p-6 sm:p-8 md:p-12 text-center rounded-2xl border border-white/5 bg-slate-800/40 backdrop-blur-md">
            <motion.img
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              src={lockIcon}
              alt="Locked"
              className="w-24 h-24 mx-auto mb-6"
            />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Jobs Feature Locked</h2>
            <p className="text-base sm:text-lg text-gray-400 mb-8">
              Complete 60% of your preparation to unlock exclusive job opportunities from top companies.
            </p>

            {/* Progress bar */}
            <div className="mb-10 max-w-md mx-auto">
              <div className="text-4xl font-bold text-blue-400 mb-4">{progress}% Complete</div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1 }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full"
                />
              </div>
              <p className="text-gray-400 mt-2">{60 - progress}% more needed to unlock</p>
            </div>

            {/* ── Demo button → toggles search form ── */}
            {!isDemoPreview ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDemoPreview(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all"
              >
                🚀 Try Demo Jobs
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-blue-400 text-left">🔍 Search Jobs</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsDemoPreview(false);
                      setSearched(false);
                      setJobs([]);
                      setError('');
                    }}
                    className="text-sm px-4 py-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-all"
                  >
                    ✕ Close
                  </motion.button>
                </div>

                <form onSubmit={handleSearch} className="space-y-4 text-left">
                  {/* Job title input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Job Description / Title</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g., Senior Developer, Data Scientist, Backend Engineer..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-lg bg-slate-700/50 text-white placeholder-gray-500 border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <MicIcon />
                      </span>
                    </div>
                  </div>

                  {/* Location dropdowns + search button */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Country</label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Select Country</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">State/Province</label>
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        disabled={!selectedCountry}
                        className={selectClass}
                      >
                        <option value="">Select State</option>
                        {getStates().map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">City</label>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        disabled={!selectedState}
                        className={selectClass}
                      >
                        <option value="">Select City</option>
                        {getCities().map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-60 text-white rounded-lg font-semibold shadow-lg transition-all"
                      >
                        {loading ? '⏳ Searching...' : '🚀 Find Jobs'}
                      </motion.button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          {/* Demo results — rendered below the lock card */}
          <AnimatePresence>
            {isDemoPreview && searched && (
              <motion.div
                key="demo-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="mt-10 space-y-6"
              >
                <h3 className="text-2xl font-bold text-white">
                  {loading
                    ? 'Fetching jobs...'
                    : `🎯 Demo Preview — ${jobs.length} Opportunities`}
                </h3>

                {loading ? (
                  <div className="text-center py-16">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block text-4xl mb-4"
                    >
                      ⏳
                    </motion.div>
                    <p className="text-gray-400 text-lg">Searching...</p>
                  </div>
                ) : jobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job, idx) => (
                      <JobCard key={job.job_id || job.id || idx} job={job} index={idx} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-gray-700">
                    <p className="text-2xl text-gray-400 mb-2">😔 No jobs returned</p>
                    <p className="text-gray-500">Try different keywords or location filters</p>
                    {error && <p className="text-red-400 text-xs mt-2">Error: {error}</p>}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      ) : (
        /* ══════════════════════════════════════
           UNLOCKED STATE
        ══════════════════════════════════════ */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-8"
        >
          {/* ── Search Filters ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-white/10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Find Matching Opportunities 🔍</h2>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Job Description / Title</label>
                <div className="relative">
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    placeholder="e.g., Senior Developer, Data Scientist, Backend Engineer..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-lg bg-slate-700/50 text-white placeholder-gray-500 border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    title="Voice input (coming soon)"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <MicIcon />
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Country</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </motion.select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">State/Province</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    disabled={!selectedCountry}
                    className={selectClass}
                  >
                    <option value="">Select State</option>
                    {getStates().map(s => <option key={s} value={s}>{s}</option>)}
                  </motion.select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">City</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    disabled={!selectedState}
                    className={selectClass}
                  >
                    <option value="">Select City</option>
                    {getCities().map(c => <option key={c} value={c}>{c}</option>)}
                  </motion.select>
                </div>

                <div className="flex items-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-60 text-white rounded-lg font-semibold shadow-lg hover:shadow-blue-500/50 transition-all"
                  >
                    {loading ? '⏳ Searching...' : 'Find Opportunities'}
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>

          {/* ── Search Results ── */}
          <AnimatePresence>
            {searched && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-white">
                  {loading ? 'Searching...' : `Found ${jobs.length} Opportunities`}
                </h3>

                {loading ? (
                  <div className="text-center py-16">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block text-4xl mb-4"
                    >
                      ⏳
                    </motion.div>
                    <p className="text-gray-400 text-lg">Searching for matching jobs...</p>
                  </div>
                ) : jobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job, idx) => (
                      <JobCard key={job.job_id || job.id || idx} job={job} index={idx} />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-slate-800/50 rounded-xl border border-gray-700"
                  >
                    <p className="text-2xl text-gray-400 mb-2">😔 No jobs found</p>
                    <p className="text-gray-500">Try adjusting your search filters or keywords</p>
                    {error && <p className="text-red-400 text-xs mt-2">Error: {error}</p>}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Pre-search empty state ── */}
          {!searched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-center py-20 bg-slate-800/30 rounded-2xl border border-white/5"
            >
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">Search for Opportunities</h3>
              <p className="text-gray-400">
                Enter a job title or description above and click{' '}
                <span className="text-blue-400 font-medium">Find Opportunities</span> to get started.
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Jobs;
