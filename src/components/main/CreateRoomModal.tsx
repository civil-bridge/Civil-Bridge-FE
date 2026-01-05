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
    '부산광역시': [
        '강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구',
        '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'
    ],
    '대구광역시': [
        '군위군', '남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'
    ],
    '인천광역시': [
        '강화군', '계양구', '미추홀구', '남동구', '동구', '부평구', '서구', '연수구', '옹진군', '중구'
    ],
    '광주광역시': [
        '광산구', '남구', '동구', '북구', '서구'
    ],
    '대전광역시': [
        '대덕구', '동구', '서구', '유성구', '중구'
    ],
    '울산광역시': [
        '남구', '동구', '북구', '울주군', '중구'
    ],
    '세종특별자치시': [
        '세종특별자치시'
    ],
    '경기도': [
        '가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시',
        '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시',
        '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시',
        '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'
    ],
    '강원특별자치도': [
        '강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군',
        '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군',
        '화천군', '횡성군'
    ],
    '충청북도': [
        '괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군',
        '진천군', '청주시', '충주시'
    ],
    '충청남도': [
        '계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시',
        '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'
    ],
    '전북특별자치도': [
        '고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군',
        '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'
    ],
    '전라남도': [
        '강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시',
        '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군',
        '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'
    ],
    '경상북도': [
        '경산시', '경주시', '고령군', '구미시', '김천시', '문경시', '봉화군', '상주시',
        '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군',
        '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'
    ],
    '경상남도': [
        '거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군',
        '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군',
        '함양군', '합천군'
    ],
    '제주특별자치도': [
        '서귀포시', '제주시'
    ]
};

import Select, { type StylesConfig } from 'react-select';

interface RegionOption {
    value: string;
    label: string;
}

const customStyles: StylesConfig<RegionOption, false> = {
    control: (base, state) => ({
        ...base,
        backgroundColor: '#FAFAF9', // bg-neutral-50
        borderColor: state.isFocused ? '#C026D3' : '#E7E5E4', // primary-500 : neutral-200
        borderRadius: '12px', // rounded-xl
        paddingLeft: '8px',
        paddingRight: '8px',
        minHeight: '48px',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(192, 38, 211, 0.2)' : 'none',
        '&:hover': {
            borderColor: '#C026D3'
        },
        transition: 'all 0.2s',
        cursor: 'pointer'
    }),
    valueContainer: (base) => ({
        ...base,
        padding: '0 4px'
    }),
    input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
        color: '#262626' // neutral-800
    }),
    singleValue: (base) => ({
        ...base,
        color: '#262626' // neutral-800
    }),
    placeholder: (base) => ({
        ...base,
        color: '#A3A3A3' // neutral-400
    }),
    menu: (base) => ({
        ...base,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        zIndex: 50
    }),
    menuList: (base) => ({
        ...base,
        maxHeight: '200px',
        padding: 0
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#C026D3' : state.isFocused ? '#FAE8FF' : 'white',
        color: state.isSelected ? 'white' : '#404040', // neutral-700
        cursor: 'pointer',
        padding: '10px 16px',
        '&:active': {
            backgroundColor: '#C026D3'
        }
    }),
    indicatorSeparator: () => ({
        display: 'none'
    }),
    dropdownIndicator: (base) => ({
        ...base,
        color: '#A3A3A3'
    })
};

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [description, setDescription] = useState('');

    const isFormValid = title.trim() !== '' && city !== '' && district !== '' && description.trim() !== '';

    const cityOptions: RegionOption[] = Object.keys(REGIONS).map(c => ({
        value: c,
        label: c
    }));

    const districtOptions: RegionOption[] = city
        ? REGIONS[city as keyof typeof REGIONS].map(d => ({
            value: d,
            label: d
        }))
        : [];

    const handleCityChange = (newValue: RegionOption | null) => {
        setCity(newValue ? newValue.value : '');
        setDistrict('');
    };

    const handleDistrictChange = (newValue: RegionOption | null) => {
        setDistrict(newValue ? newValue.value : '');
    };

    const handleCreate = () => {
        if (!isFormValid) return;
        console.log('Creating room:', { title, region: `${city} ${district}`, description });
        alert('논의방이 생성되었습니다.');
        onClose();
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
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-neutral-700">
                            시/도 선택 <span className="text-primary-500">*</span>
                        </label>
                        <Select
                            options={cityOptions}
                            value={city ? { value: city, label: city } : null}
                            onChange={handleCityChange}
                            placeholder="시/도를 선택하세요"
                            styles={customStyles}
                            isSearchable
                            noOptionsMessage={() => "검색 결과가 없습니다"}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-neutral-700">
                            시/군/구 선택 <span className="text-primary-500">*</span>
                        </label>
                        <Select
                            options={districtOptions}
                            value={district ? { value: district, label: district } : null}
                            onChange={handleDistrictChange}
                            placeholder="시/군/구를 선택하세요"
                            styles={customStyles}
                            isSearchable
                            isDisabled={!city}
                            noOptionsMessage={() => city ? "검색 결과가 없습니다" : "시/도를 먼저 선택하세요"}
                        />
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
