import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '../store/AuthSlice';
import { addToast } from '../store/UiSlice';
import { X, User, Mail, Image } from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose }) {
    const currentUser = useSelector((state) => state.auth.currentUser);
    const dispatch = useDispatch();

    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [avatar, setAvatar] = useState(currentUser?.avatar || '');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return;

        dispatch(updateUserProfile({
            name: name.trim(),
            email: email.trim(),
            avatar: avatar.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
        }));

        dispatch(addToast({ message: 'Profile updated successfully', type: 'success' }));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col animate-in zoom-in-95 duration-150">
                
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-neutral-50/50 dark:bg-gray-950/50">
                    <div className="flex items-center space-x-2">
                        <User size={18} className="text-primary" />
                        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Edit User Profile</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                    <div className="flex justify-center mb-2">
                        <div className="h-16 w-16 rounded-full border-2 border-primary overflow-hidden shadow-sm">
                            <img
                                src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`}
                                alt="Avatar preview"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                            Full Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            />
                            <User size={15} className="absolute left-3 top-2.5 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                            Email Address
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            />
                            <Mail size={15} className="absolute left-3 top-2.5 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                            Avatar Image URL
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={avatar}
                                onChange={(e) => setAvatar(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <Image size={15} className="absolute left-3 top-2.5 text-gray-400" />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-xl font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold shadow-sm transition-colors cursor-pointer"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
