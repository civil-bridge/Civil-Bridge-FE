import React, { useState } from 'react';
import CreateRoomModal from './CreateRoomModal';

const HeroSection: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <section className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
            <div className="hero-gradient rounded-[24px] px-12 py-16 mt-8 mb-12 relative overflow-hidden text-white">
                {/* Decorative Background Circles */}
                <div className="absolute rounded-full pointer-events-none w-[400px] h-[400px] bg-white/10 -top-[100px] -right-[100px] animate-float1" />
                <div className="absolute rounded-full pointer-events-none w-[200px] h-[200px] bg-white/10 bottom-[-50px] left-[10%] animate-float2" />
                <div className="absolute rounded-full pointer-events-none w-[150px] h-[150px] bg-white/5 top-[30%] right-[20%] animate-float3" />

                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                        시민의 목소리로 만드는 변화
                    </h1>
                    <p className="text-lg opacity-90 mb-8">
                        지역 문제를 함께 논의하고 해결책을 제안하는 열린 공간입니다
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-white text-primary-600 px-7 py-3.5 rounded-xl font-semibold hover:bg-neutral-50 transition-colors"
                    >
                        새로운 토의방 만들기
                    </button>
                </div>
            </div>

            <CreateRoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </section>
    );
};

export default HeroSection;
