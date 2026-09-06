import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/AuthSlice';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://server-six-tau-53.vercel.app/api'}/auth`;

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
            
            // Dispatch credentials to Redux & LocalStorage
            dispatch(setCredentials({
                user: response.data.user,
                token: response.data.token
            }));

            // Navigate to Dashboard
            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            const message = err.response?.data?.error || 'Unable to log in. Please check your credentials or server.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-screen flex bg-neutral-50 font-sans text-gray-900">
            {/* Left Showcase Panel (Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 p-12 flex-col justify-between text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(13,148,136,0.25),transparent_50%)] pointer-events-none" />
                
                {/* Brand Logo */}
                <div className="flex items-center space-x-3 z-10">
                    <div className="h-9 w-9 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-sm font-bold text-base text-white">
                        K
                    </div>
                    <div>
                        <span className="text-base font-semibold tracking-wide">Kinetic</span>
                        <span className="text-xs text-teal-300 block font-normal -mt-0.5">Workspace Cloud</span>
                    </div>
                </div>

                {/* Hero Showcase Message */}
                <div className="space-y-6 z-10 max-w-md">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-teal-200">
                        <Sparkles size={13} className="text-teal-300" />
                        <span>Sprint 34 Active Collaboration</span>
                    </div>

                    <h2 className="text-3xl font-bold leading-tight tracking-tight">
                        Orchestrate projects, tasks, and sprints with clarity.
                    </h2>
                    
                    <p className="text-sm text-teal-100/80 leading-relaxed">
                        Experience real-time interactive Kanban boards, column drag-and-drop workflows, and unified team collaboration in one sleek workspace.
                    </p>

                    <div className="pt-4 space-y-2.5">
                        <div className="flex items-center space-x-2.5 text-xs text-teal-100">
                            <CheckCircle size={15} className="text-teal-300 shrink-0" />
                            <span>Effortless visual task prioritization</span>
                        </div>
                        <div className="flex items-center space-x-2.5 text-xs text-teal-100">
                            <CheckCircle size={15} className="text-teal-300 shrink-0" />
                            <span>MongoDB Cloud-backed persistent workspace</span>
                        </div>
                        <div className="flex items-center space-x-2.5 text-xs text-teal-100">
                            <CheckCircle size={15} className="text-teal-300 shrink-0" />
                            <span>Instant column drag-and-drop reordering</span>
                        </div>
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="z-10 text-xs text-teal-200/60 border-t border-white/10 pt-6">
                    © 2026 Kinetic Workspace Inc. All rights reserved.
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
                <div className="w-full max-w-md space-y-7">
                    
                    {/* Header */}
                    <div className="space-y-2 text-center lg:text-left">
                        <div className="lg:hidden flex items-center justify-center space-x-2 mb-4">
                            <div className="h-8 w-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                K
                            </div>
                            <span className="font-bold text-base text-gray-900">Kinetic Workspace</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
                        <p className="text-xs text-gray-500">Sign in to your account to access your workspace dashboard</p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start space-x-3 text-red-700 text-xs animate-in fade-in duration-200">
                            <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
                            <div className="flex-1 font-medium">{error}</div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-xs"
                                    required
                                    autoFocus
                                />
                                <Mail size={16} className="absolute left-3.5 top-3 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Password
                                </label>
                                <span className="text-[11px] text-primary hover:underline cursor-pointer">
                                    Forgot password?
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-xs"
                                    required
                                />
                                <Lock size={16} className="absolute left-3.5 top-3 text-gray-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 p-0.5"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                                />
                                <span className="text-xs text-gray-600">Remember me for 30 days</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-sm hover:shadow disabled:opacity-60 cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center space-x-2">
                                    <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Signing in...</span>
                                </span>
                            ) : (
                                <>
                                    <span>Sign in to Workspace</span>
                                    <ArrowRight size={15} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Switch to Register */}
                    <div className="pt-4 text-center border-t border-gray-100">
                        <p className="text-xs text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary font-semibold hover:underline ml-1">
                                Create an account
                            </Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
