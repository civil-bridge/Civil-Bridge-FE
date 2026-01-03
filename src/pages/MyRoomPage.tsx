import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, CheckCircle2, Mail, LogOut } from 'lucide-react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

const MyRoomPage: React.FC = () => {
    const navigate = useNavigate();

    // State Management
    const [isCertified, setIsCertified] = useState(false);
    const [nickname, setNickname] = useState('김시민');
    const [email, setEmail] = useState('example@email.com');
    const [certEmail, setCertEmail] = useState('');

    // Modal States
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showCertSentModal, setShowCertSentModal] = useState(false);

    // Dummy user data
    const userData = {
        nickname: nickname,
        email: email,
        profileImage: null, // Placeholder for circular image
        certifiedEmail: 'official@go.kr',
        certifiedDate: '2025.01.02'
    };

    const handleSaveInfo = () => {
        // Mock save logic
        alert('변경사항이 저장되었습니다.');
    };

    const handleSendCertMail = () => {
        setShowCertSentModal(true);
    };

    const handleLogout = () => {
        // Mock logout logic
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center">
            {/* 1. Header */}
            <header className="w-full h-16 bg-white border-b border-neutral-200 flex items-center shrink-0 sticky top-0 z-20">
                <div className="w-full max-w-[640px] mx-auto px-4 flex items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                        <ChevronLeft size={24} className="text-neutral-700" />
                    </button>
                    <h1 className="ml-2 text-lg font-bold text-neutral-800">마이룸</h1>
                </div>
            </header>

            <main className="w-full max-w-[640px] px-4 py-8 flex flex-col gap-8">
                {/* 2. Profile Section */}
                <section className="flex flex-col items-center py-4">
                    <div className="relative group cursor-pointer">
                        <div className="w-[120px] h-[120px] rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm transition-transform group-hover:scale-[1.02]">
                            {userData.profileImage ? (
                                <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-neutral-400 font-bold text-3xl">{nickname[0]}</span>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-neutral-100 text-neutral-600">
                            <Camera size={18} />
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-1">
                        <h2 className="text-xl font-bold text-neutral-800">{nickname}</h2>
                        <span className="text-sm text-[#78716C]">{email}</span>
                    </div>

                    <div className="mt-6">
                        {isCertified ? (
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-primary-50 text-primary-600 rounded-full text-sm font-semibold border border-primary-100">
                                <CheckCircle2 size={16} />
                                <span>공무원 인증 완료</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsCertified(!isCertified)} // Toggle for demo
                                className="px-4 py-2 border border-neutral-300 text-neutral-600 rounded-full text-sm font-medium hover:bg-neutral-100 transition-colors"
                            >
                                공무원 인증하기
                            </button>
                        )}
                    </div>
                </section>

                {/* 3. Member Info Section */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
                    <h3 className="text-lg font-bold text-neutral-800 mb-6">회원정보 수정</h3>
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-neutral-600">닉네임</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-neutral-600">이메일</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800"
                            />
                        </div>
                        <div className="pt-2 flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-neutral-600">현재 비밀번호</label>
                                <input
                                    type="password"
                                    placeholder="현재 비밀번호 입력"
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-neutral-600">새 비밀번호</label>
                                <input
                                    type="password"
                                    placeholder="새 비밀번호 입력"
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-neutral-600">새 비밀번호 확인</label>
                                <input
                                    type="password"
                                    placeholder="새 비밀번호 다시 입력"
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleSaveInfo}
                            className="mt-2 w-full py-4 rounded-xl font-bold bg-primary-500 hover:bg-primary-600 text-white transition-colors"
                        >
                            변경사항 저장
                        </Button>
                    </div>
                </section>

                {/* 4. Official Certification Section */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
                    <h3 className="text-lg font-bold text-neutral-800 mb-2">공무원 인증</h3>

                    {isCertified ? (
                        <div className="py-2">
                            <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <p className="text-neutral-800 font-semibold">공무원 인증이 완료되었습니다.</p>
                                    <div className="mt-2 flex flex-col gap-0.5">
                                        <p className="text-sm text-neutral-500">인증 이메일: <span className="text-neutral-700 font-medium">{userData.certifiedEmail}</span></p>
                                        <p className="text-sm text-neutral-500">인증일: <span className="text-neutral-700 font-medium">{userData.certifiedDate}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            <p className="text-sm text-neutral-500 leading-relaxed">
                                공무원 전용 이메일로 인증하여 공무원 뱃지를 받으세요.
                                다른 시민들에게 신뢰를 줄 수 있습니다.
                            </p>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-neutral-600">공무원 이메일</label>
                                <input
                                    type="email"
                                    value={certEmail}
                                    onChange={(e) => setCertEmail(e.target.value)}
                                    placeholder="@go.kr / @korea.kr 등"
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800"
                                />
                            </div>
                            <Button
                                variant="secondary"
                                onClick={handleSendCertMail}
                                className="w-full py-3.5 rounded-xl font-bold border-2"
                            >
                                <Mail size={18} className="mr-2" />
                                인증 메일 발송
                            </Button>
                        </div>
                    )}
                </section>

                {/* 5. Logout Section */}
                <section className="flex justify-center pb-8 mt-4">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="flex items-center gap-2 text-[#DC2626] font-semibold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        로그아웃
                    </button>
                </section>
            </main>

            {/* 6. Modals */}
            <Modal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                title="로그아웃"
                footer={
                    <div className="flex gap-3 w-full">
                        <Button
                            variant="secondary"
                            className="flex-1 rounded-xl"
                            onClick={() => setShowLogoutModal(false)}
                        >
                            취소
                        </Button>
                        <Button
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl"
                            onClick={handleLogout}
                        >
                            확인
                        </Button>
                    </div>
                }
            >
                <p className="text-neutral-600 py-2">정말 로그아웃 하시겠습니까?</p>
            </Modal>

            <Modal
                isOpen={showCertSentModal}
                onClose={() => setShowCertSentModal(false)}
                title="인증 메일 발송 완료"
                footer={
                    <Button
                        className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-3.5"
                        onClick={() => setShowCertSentModal(false)}
                    >
                        확인
                    </Button>
                }
            >
                <p className="text-neutral-600 py-2 leading-relaxed">
                    인증 메일이 발송되었습니다.<br />
                    입력하신 메일함을 확인하여 인증을 완료해주세요.
                </p>
            </Modal>
        </div>
    );
};

export default MyRoomPage;
