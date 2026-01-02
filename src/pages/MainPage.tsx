import React from 'react';
import Header from '../components/common/Header';
import HeroSection from '../components/main/HeroSection';
import RoomListSection from '../components/main/RoomListSection';

const MainPage: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
                <HeroSection />
                <RoomListSection />
            </main>

            {/* Simple Footer */}
            <footer className="py-12 bg-neutral-100 border-t border-neutral-200">
                <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-neutral-400 text-sm">
                            © 2026 Civil Bridge. All rights reserved.
                        </div>
                        <div className="flex items-center gap-8 text-neutral-500 text-sm font-medium">
                            <a href="#" className="hover:text-primary-500 transition-colors">서비스 소개</a>
                            <a href="#" className="hover:text-primary-500 transition-colors">이용약관</a>
                            <a href="#" className="hover:text-primary-500 transition-colors">개인정보처리방침</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainPage;
