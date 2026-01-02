import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const REGIONS = {
    '서울특별시': [
        '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
        '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
        '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
    ],
    '경기도': [
        '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시',
        '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시',
        '양주시', '여주시', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시',
        '평택시', '포천시', '하남시', '화성시', '가평군', '양평군', '연천군'
    ]
};

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [description, setDescription] = useState('');

    const isFormValid = title.trim() !== '' && city !== '' && district !== '' && description.trim() !== '';

    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCity(e.target.value);
        setDistrict(''); // Reset district when city changes
    };

    const handleCreate = () => {
        if (!isFormValid) return;
        // Mock creation logic
        console.log('Creating room:', { title, region: `${city} ${district}`, description });
        alert('논의방이 생성되었습니다.');
        onClose();
        // Reset form
        setTitle('');
        setCity('');
        setDistrict('');
        setDescription('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="논의방 만들기"
            footer={
                <div className="flex gap-3 w-full">
                    <Button
                        variant="secondary"
                        className="flex-1 rounded-xl"
                        onClick={onClose}
                    >
                        취소
                    </Button>
                    <Button
                        className="flex-1 rounded-xl"
                        disabled={!isFormValid}
                        onClick={handleCreate}
                    >
                        생성하기
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-6">
                {/* 1. Room Title */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-neutral-700">
                        방 제목 <span className="text-primary-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800 placeholder:text-neutral-400"
                    />
                    <div className="flex justify-end italic">
                        <span className="text-[10px] text-neutral-400">{title.length}/50</span>
                    </div>
                </div>

                {/* 2. Region Selection - 2 Steps */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 text-neutral-800">
                        <label className="text-sm font-semibold text-neutral-700">
                            시/도 선택 <span className="text-primary-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={city}
                                onChange={handleCityChange}
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800 appearance-none cursor-pointer"
                            >
                                <option value="" disabled>시/도를 선택하세요</option>
                                {Object.keys(REGIONS).map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-neutral-700">
                            시/군/구 선택 <span className="text-primary-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                disabled={!city}
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800 appearance-none ${!city ? 'bg-neutral-100 border-neutral-200 cursor-not-allowed' : 'bg-neutral-50 border-neutral-200 cursor-pointer'
                                    }`}
                            >
                                <option value="" disabled>시/군/구를 선택하세요</option>
                                {city && REGIONS[city as keyof typeof REGIONS].map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Room Description */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-neutral-700">
                        방 설명 <span className="text-primary-500">*</span>
                    </label>
                    <textarea
                        rows={4}
                        placeholder="논의 주제에 대해 설명해주세요 (최대 200자)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-neutral-800 placeholder:text-neutral-400 resize-none"
                    />
                    <div className="flex justify-end">
                        <span className="text-xs text-neutral-400">{description.length}/200</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CreateRoomModal;
