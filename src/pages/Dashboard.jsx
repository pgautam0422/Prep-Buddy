import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Chat from './Chat';
import dashboardIcon from '../assets/icons/dashboard.svg';
import checkmarkIcon from '../assets/icons/checkmark.svg';
import fireIcon from '../assets/icons/fire.svg';
import chatbotIcon from '../assets/icons/chatbot.svg';
import { updateUserSettings } from '../lib/api';
import { useProfile } from '../context/ProfileContext';

const defaultProfile = {
  stats: {
    progressStreak: 0,
    totalCompleted: 0,
    totalTopics: 0,
    completionRate: 0,
    completedToday: 0,
    bookmarkedCount: 0,
    revisionDueCount: 0,
    accuracy: 0,
    sectionSummaries: {},
    weeklyActivity: [],
  },
  settings: {
    dailyGoal: 5,
  },
  insights: {
    recommendedTasks: [],
    revisionQueue: [],
    bookmarks: [],
  },
};

const Dashboard = () => {
  const { profile: contextProfile, refreshProfile } = useProfile();
  const [profile, setProfile] = useState(defaultProfile);
  const [tipIndex, setTipIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [goalSaving, setGoalSaving] = useState(false);
  const chatPanelRef = useRef(null);

  const tips = [
    'Review one weak topic daily for 15 minutes.',
    'Solve 3 coding problems from different companies.',
    'Practice mock interviews twice a week.',
    'Focus on debugging speed with timed challenges.',
    'Balance theory with hands-on question practice.',
  ];

  // Load fresh profile on Dashboard mount so stats are always current
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await refreshProfile();
        setProfile({
          stats: user.stats,
          settings: user.settings,
          insights: user.insights,
        });
      } catch (error) {
        // Fall back to context profile if refresh fails (e.g. offline)
        if (contextProfile) {
          setProfile({
            stats: contextProfile.stats,
            settings: contextProfile.settings,
            insights: contextProfile.insights,
          });
        }
        console.error('Failed to load dashboard stats:', error);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chatOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        chatPanelRef.current &&
        !chatPanelRef.current.contains(event.target) &&
        !event.target.closest('button[aria-label="Open chat"]')
      ) {
        setChatOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setChatOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [chatOpen]);

  const handleDailyGoalChange = async (value) => {
    const safeValue = Number(value);
    setProfile((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        dailyGoal: safeValue,
      },
    }));

    if (!Number.isInteger(safeValue) || safeValue < 1 || safeValue > 50) {
      return;
    }

    setGoalSaving(true);
    try {
      const response = await updateUserSettings({ dailyGoal: safeValue });
      setProfile((prev) => ({
        ...prev,
        settings: response.user.settings,
      }));
    } catch (error) {
      console.error('Failed to save daily goal:', error);
    } finally {
      setGoalSaving(false);
    }
  };

  const goalProgress = Math.min(
    100,
    Math.round((profile.stats.completedToday / Math.max(profile.settings.dailyGoal || 1, 1)) * 100)
  );
  const sectionCards = Object.values(profile.stats.sectionSummaries || {});

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 md:p-8"
    >
      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center text-white"
      >
        Your Dashboard
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
      >
        <motion.div whileHover={{ scale: 1.05 }} className="glass-card glass-hover text-[#ffffff] p-5 sm:p-8">
          <img src={dashboardIcon} alt="Progress" className="w-12 h-12 mb-4 icon-theme" />
          <h2 className="text-2xl font-semibold mb-4 text-[#4285f4]">Progress</h2>
          <div className="text-5xl font-bold mb-2">{profile.stats.completionRate}%</div>
          <div className="w-full bg-[#2d2d2d] rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profile.stats.completionRate}%` }}
              transition={{ delay: 0.8, duration: 1 }}
              className="bg-[#4285f4] h-3 rounded-full"
            />
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} className="glass-card glass-hover text-[#ffffff] p-5 sm:p-8">
          <img src={checkmarkIcon} alt="Completed" className="w-12 h-12 mb-4 icon-theme" />
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-[#34a853]">Completed Today</h2>
          <div className="text-4xl sm:text-5xl font-bold">{profile.stats.completedToday}</div>
          <p className="text-sm mt-2">Goal progress: {goalProgress}%</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} className="glass-card glass-hover text-[#ffffff] p-5 sm:p-8">
          <img src={dashboardIcon} alt="Revision" className="w-12 h-12 mb-4 icon-theme" />
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-[#ea4335]">Revision Queue</h2>
          <div className="text-4xl sm:text-5xl font-bold">{profile.stats.revisionDueCount}</div>
          <p className="text-sm mt-2">{profile.stats.bookmarkedCount} bookmarked topics</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} className="glass-card glass-hover text-[#ffffff] p-5 sm:p-8">
          <img src={fireIcon} alt="Streak" className="w-12 h-12 mb-4 icon-theme" />
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-[#fbbc04]">Streak</h2>
          <div className="text-4xl sm:text-5xl font-bold">{profile.stats.progressStreak} days</div>
          <p className="text-sm mt-2">Stay consistent to keep it going</p>
        </motion.div>
      </motion.div>

      {/* Accuracy banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="mt-8 glass-card p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm text-slate-400 mb-1">Study Accuracy</p>
          <p className="text-xs text-slate-500">
            Topics marked done <em>after</em> opening study material
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="w-full sm:w-48 bg-slate-800 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profile.stats.accuracy}%` }}
              transition={{ delay: 1, duration: 1 }}
              className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
            />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-amber-400">{profile.stats.accuracy}%</span>
        </div>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 xl:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="glass-card p-6 xl:col-span-2"
        >
          <h3 className="text-xl font-semibold mb-5 text-[#8ab4ff]">Section Progress</h3>
          <div className="space-y-4">
            {sectionCards.map((section) => (
              <div key={section.label}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white font-medium">{section.label}</span>
                  <span className="text-slate-300">
                    {section.completed}/{section.total}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"
                    style={{ width: `${section.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold mb-4 text-[#34a853]">Daily Goal</h3>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={profile.settings.dailyGoal}
              min="1"
              max="50"
              onChange={(e) => handleDailyGoalChange(Number(e.target.value))}
              className="w-24 p-2 rounded-md border border-[#2d2d2d] bg-[#2d2d2d] text-[#ffffff] focus:border-[#4285f4] focus:outline-none"
            />
            <span className="text-sm text-[#cccccc]">tasks per day</span>
          </div>
          <p className="mt-4 text-sm text-[#cccccc]">
            {profile.stats.completedToday} completed today out of your target of {profile.settings.dailyGoal}.
          </p>
          <div className="mt-4 w-full bg-slate-800 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-400">{goalSaving ? 'Saving goal...' : 'Goal saved automatically'}</p>
        </motion.div>
      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold mb-4 text-[#34a853]">Study Tip</h3>
          <p className="text-lg font-semibold text-[#ffffff] mb-4">{tips[tipIndex]}</p>
          <button
            onClick={() => setTipIndex((prev) => (prev + 1) % tips.length)}
            className="px-4 py-2 rounded-md bg-[#4285f4] text-white hover:bg-[#3367d6] transition-colors"
          >
            Next Tip
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold mb-4 text-[#fbbc04]">Revision Reminders</h3>
          <div className="space-y-3">
            {profile.insights.revisionQueue.length > 0 ? (
              profile.insights.revisionQueue.map((task) => (
                <div key={`${task.section}-${task.name}`} className="rounded-lg bg-white/5 p-3 border border-white/10">
                  <p className="text-white font-medium">{task.name}</p>
                  <p className="text-xs text-slate-400">{task.section}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No revision reminders due yet.</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold mb-4 text-[#8ab4ff]">Recommended Next</h3>
          <div className="space-y-3">
            {profile.insights.recommendedTasks.length > 0 ? (
              profile.insights.recommendedTasks.map((task) => (
                <div key={`${task.section}-${task.name}`} className="rounded-lg bg-white/5 p-3 border border-white/10">
                  <p className="text-white font-medium">{task.name}</p>
                  <p className="text-xs text-slate-400">{task.section}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">You are all caught up for now.</p>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="mt-8 glass-card p-6"
      >
        <h3 className="text-xl font-semibold mb-5 text-white">Weekly Activity</h3>
        <div className="grid grid-cols-7 gap-3">
          {(profile.stats.weeklyActivity || []).map((day) => (
            <div key={day.key} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className="text-xs text-slate-400 mb-2">{day.label}</p>
              <div className="h-24 flex items-end justify-center">
                <div
                  className="w-8 rounded-t-lg bg-gradient-to-t from-cyan-500 to-blue-500"
                  style={{ height: `${Math.max(12, day.count * 18)}px` }}
                />
              </div>
              <p className="mt-2 text-sm text-white font-medium">{day.count}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open chat"
      >
        <img src={chatbotIcon} alt="Chatbot" className="w-10 h-10" />
      </motion.button>

      {chatOpen ? (
        <motion.div
          ref={chatPanelRef}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 right-6 z-40 w-80 md:w-96 h-[480px] rounded-2xl bg-slate-900 border border-white/20 shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between flex-shrink-0">
            <h3 className="text-white font-bold">Chat Assistant</h3>
            <button
              onClick={() => setChatOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-1"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <Chat embedded />
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export default Dashboard;
