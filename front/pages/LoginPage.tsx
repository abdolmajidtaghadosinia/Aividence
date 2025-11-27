
import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogoIcon } from '../components/Icons';
import Logo from '../components/Logo';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [time, setTime] = useState(new Date());

  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (email.trim() === '') {
      return;
    }
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // خطا در AuthContext مدیریت می‌شود
      console.error('Login failed:', err);
    }
  };
  
  const formattedDate = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(time);

  const formattedTime = time.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
  });

  return (
    <div className="min-h-screen flex flex-col">
        <header className="py-6 px-8 flex justify-between items-center text-gray-600">
            <Logo size="md" showText={true} />
            <div className="px-4 py-2 rounded-full glass-panel text-sm flex items-center gap-2">
                 <span className="text-gray-500">{formattedDate}</span>
                 <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                 <span className="font-semibold text-slate-700">{formattedTime}</span>
            </div>
        </header>
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-lg soft-card rounded-3xl p-10 border border-white/70 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl gradient-chip flex items-center justify-center shadow-inner mb-3">
                <LogoIcon className="w-8 h-8 text-sky-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">ورود به سامانه</h2>
            <p className="text-gray-500 mt-2">
              لطفا اطلاعات خود را برای ورود وارد کنید
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                ایمیل
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ایمیل خود را وارد کنید"
                className="w-full px-4 py-3 border border-white/60 rounded-xl bg-white/70 focus:ring-sky-500 focus:border-sky-500 transition shadow-sm"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                      رمز عبور
                  </label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور را وارد کنید"
                className="w-full px-4 py-3 border border-white/60 rounded-xl bg-white/70 focus:ring-sky-500 focus:border-sky-500 transition shadow-sm"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full pill-button font-bold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition"
            >
              {isLoading ? 'در حال ورود...' : 'ورود'}
            </button>
          </form>
        </div>
      </main>
       <footer className="text-center py-4 text-gray-500 text-sm">
            <p>2025 کلیه حقوق محفوظ است.</p>
       </footer>
    </div>
  );
};

export default LoginPage;