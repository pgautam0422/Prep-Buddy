import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import learningIcon from '../assets/icons/learning.svg';
import progressIcon from '../assets/icons/progress.svg';
import targetIcon from '../assets/icons/target.svg';
import number1Icon from '../assets/icons/number-1.svg';
import number2Icon from '../assets/icons/number-2.svg';
import number3Icon from '../assets/icons/number-3.svg';
import number4Icon from '../assets/icons/number-4.svg';
import rocketIcon from '../assets/icons/rocket.svg';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1e] to-[#0d0d15]">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="glass-panel text-center text-white mb-10 sm:mb-12 md:mb-16 p-6 sm:p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
          <div className="relative z-10">
          <motion.h1
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] to-[#ec4899]"
          >
          PREP BUDDY 
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg sm:text-xl md:text-2xl mb-4 max-w-3xl mx-auto text-[#e0e7ff] font-semibold"
          >
            Your comprehensive companion for acing placement interviews.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-base sm:text-lg md:text-xl mb-8 max-w-2xl mx-auto text-[#cbd5e1]"
          >
            Start your journey with structured tracking of DSA, core subjects, and aptitude. Complete tasks daily to build momentum.
          </motion.p>
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex justify-center"
          >
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f59e0b] via-[#8b5cf6] to-[#06b6d4] hover:from-[#d97706] hover:via-[#7c3aed] hover:to-[#0891b2] text-white px-6 sm:px-10 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg shadow-2xl shadow-amber-500/50 transform hover:scale-110 transition-all duration-300 border border-white/20"
            >
              
              Start Your Journey
            </Link>
          </motion.div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] via-[#06b6d4] to-[#8b5cf6]">What Makes Us Different</h2>
          <p className="text-center text-[#cbd5e1] mb-12 text-lg">Powerful features designed to accelerate your learning journey</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ scale: 1.08, y: -8 }}
              className="glass-card glass-hover p-8 text-white group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
              <img src={learningIcon} alt="Learning" className="w-16 h-16 mb-4 mx-auto icon-theme group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-[#0ea5e9] to-[#06b6d4] bg-clip-text text-transparent">Structured Curriculum</h3>
              <p className="text-[#cbd5e1]">Comprehensive coverage of DSA algorithms, core computer science subjects, and aptitude topics with clear learning paths.</p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.08, y: -8 }}
              className="glass-card glass-hover p-8 text-white group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
              <img src={progressIcon} alt="Progress" className="w-16 h-16 mb-4 mx-auto icon-theme group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-[#f59e0b] to-[#ec4899] bg-clip-text text-transparent">Progress Tracking</h3>
              <p className="text-[#cbd5e1]">Real-time progress monitoring with streak counters, completion percentages, and detailed analytics to keep you motivated.</p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.08, y: -8 }}
              className="glass-card glass-hover p-8 text-white group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
              <img src={targetIcon} alt="Target" className="w-16 h-16 mb-4 mx-auto icon-theme group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-[#14b8a6] to-[#10b981] bg-clip-text text-transparent">Job Readiness</h3>
              <p className="text-[#cbd5e1]">Unlock job opportunities when you reach 60% completion. Get access to curated job listings matching your skills.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-[#f59e0b] via-[#ec4899] to-[#8b5cf6] mb-12">How to Use Placement Prep Buddy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              whileHover={{ scale: 1.08, y: -8 }}
              className="glass-card glass-hover p-6 text-white text-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
              <img src={number1Icon} alt="Step 1" className="w-12 h-12 mb-4 mx-auto group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-[#06b6d4] to-[#0ea5e9] bg-clip-text text-transparent">Sign Up & Login</h3>
              <p className="text-[#cbd5e1] text-sm">Create your account and start your preparation journey.</p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.08, y: -8 }}
              className="glass-card glass-hover p-6 text-white text-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
              <img src={number2Icon} alt="Step 2" className="w-12 h-12 mb-4 mx-auto group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-[#818cf8] to-[#6366f1] bg-clip-text text-transparent">Choose Your Path</h3>
              <p className="text-[#cbd5e1] text-sm">Navigate through DSA, Core Subjects, and Aptitude sections.</p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.08, y: -8 }}
              className="glass-card glass-hover p-6 text-white text-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
              <img src={number3Icon} alt="Step 3" className="w-12 h-12 mb-4 mx-auto group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-[#ec4899] to-[#f43f5e] bg-clip-text text-transparent">Track Progress</h3>
              <p className="text-[#cbd5e1] text-sm">Mark topics as completed and monitor your advancement on the dashboard.</p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.08, y: -8 }}
              className="glass-card glass-hover p-6 text-white text-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
              <img src={number4Icon} alt="Step 4" className="w-12 h-12 mb-4 mx-auto group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-[#10b981] to-[#14b8a6] bg-clip-text text-transparent">Unlock Opportunities</h3>
              <p className="text-[#cbd5e1] text-sm">Reach 60% completion to access job listings and chat support.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="text-center"
        >
          <div className="glass-card glass-hover p-10 max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-2xl"></div>
            <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-[#ffffff] mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] via-[#10b981] to-[#06b6d4]">Ready to Ace Your Placements?</h2>
            <p className="text-[#cbd5e1] mb-8 text-lg">Join thousands of students who have transformed their careers with structured preparation.</p>
            <Link
              to="/login"
              className="inline-block bg-gradient-to-r from-[#f59e0b] via-[#8b5cf6] to-[#06b6d4] hover:from-[#d97706] hover:via-[#7c3aed] hover:to-[#0891b2] text-white px-10 py-4 rounded-full font-bold text-lg shadow-2xl shadow-amber-500/40 transform hover:scale-110 transition-all duration-300 border border-white/20"
            >
              Get Started Now →
            </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;