import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../lib/api';

const Signup = ({ onAuthSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser({ name, email, password, confirmPassword });
      onAuthSuccess({ token: data.token, user: data.user });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-transparent"
      style={{
        background:
          'radial-gradient(circle at top, rgba(20,20,20,0.95) 0%, rgba(10,10,14,0.95) 45%, rgba(5,5,8,0.95) 100%)',
      }}
    >
      <div className="glass-card p-5 sm:p-8 rounded-2xl shadow-xl w-full max-w-md mx-4 border border-white/20">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#ffffff]">Sign Up</h2>
        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <label className="block text-[#ffffff] mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-white/20 rounded-md glass-input text-[#ffffff] placeholder-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#4285f4]"
              placeholder="Your full name"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#ffffff] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-white/20 rounded-md glass-input text-[#ffffff] placeholder-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#4285f4]"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#ffffff] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-white/20 rounded-md glass-input text-[#ffffff] placeholder-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#4285f4]"
              placeholder="Choose a password"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-[#ffffff] mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-white/20 rounded-md glass-input text-[#ffffff] placeholder-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#4285f4]"
              placeholder="Repeat your password"
              required
            />
          </div>
          {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-center text-[#cccccc]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#4285f4] hover:text-[#6ea7fc]">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
