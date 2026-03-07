import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface HeaderProps {
    activeTab?: 'all' | 'joined';
    onTabChange?: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
    const { isAuthenticated, user, logout } = useAuthStore();
    return (
        <header className="w-full h-16 bg-white border-b border-neutral-200 flex items-center relative z-20">
            <div className="w-full max-w-[1280px] mx-auto px-8 flex items-center justify-between">
                <div className="flex items-center">
                    <Link to="/" className="text-2xl font-bold flex items-center gap-0.5 no-underline">
                        <span className="text-primary-500">Civil</span>
                        <span className="text-neutral-700">Bridge</span>
                    </Link>

                    <nav className="flex items-center gap-8 ml-12">
                        <button
                            onClick={() => onTabChange?.('all')}
                            className={`text-base font-medium transition-colors relative py-5 ${activeTab === 'all'
                                ? 'text-primary-500 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary-500'
                                : 'text-neutral-500 hover:text-primary-500'
                                }`}
                        >
                            전체논의방
                        </button>
                        {isAuthenticated && (
                            <button
                                onClick={() => onTabChange?.('joined')}
                                className={`text-base font-medium transition-colors relative py-5 ${activeTab === 'joined'
                                    ? 'text-primary-500 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary-500'
                                    : 'text-neutral-500 hover:text-primary-500'
                                    }`}
                            >
                                내가참여중
                            </button>
                        )}
                        {isAuthenticated && (
                            <NavLink
                                to="/myroom"
                                className={({ isActive }) =>
                                    `text-base font-medium transition-colors relative py-5 ${isActive
                                        ? 'text-primary-500 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary-500'
                                        : 'text-neutral-500 hover:text-primary-500'
                                    }`
                                }
                            >
                                마이룸
                            </NavLink>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <span className="text-sm text-neutral-600 font-medium mr-2">
                                <span className="text-primary-600 font-bold">{user?.nickname}</span>님 환영합니다
                            </span>
                            <button
                                onClick={logout}
                                className="text-sm text-neutral-500 hover:text-neutral-700 font-medium px-3 py-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-base text-neutral-600 font-medium p-2 hover:text-primary-500 transition-colors">
                                로그인
                            </Link>
                            <Link to="/signup">
                                <button className="bg-primary-500 text-white px-5 py-2.5 rounded-[10px] text-base font-semibold hover:bg-primary-600 transition-colors">
                                    회원가입
                                </button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header >
    );
};

export default Header;
