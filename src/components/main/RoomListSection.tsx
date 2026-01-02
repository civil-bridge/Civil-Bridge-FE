import React from 'react';
import RoomCard from './RoomCard';
import { ChevronDown } from 'lucide-react';

const MOCK_ROOMS = [
    {
        id: 1,
        region: '수원시 영통구',
        isOfficial: true,
        title: '광교 호수공원 야간 조명 설치에 관한 건',
        description: '공원 산책로가 너무 어둡다는 의견이 많습니다. 추가 조명 설치 위치와 운영 시간에 대해 시민분들의 소중한 의견을 듣고 싶습니다.',
        participants: 124,
        createdAt: '2일 전',
    },
    {
        id: 2,
        region: '성남시 분당구',
        isOfficial: false,
        title: '판교역 앞 대중교통 환승 체계 개선 제안',
        description: '출퇴근 시간대 판교역 앞 버스 정류장 혼잡도가 매우 높습니다. 광역버스 노선 조정 및 환승 센터 구축에 대해 토의해봅시다.',
        participants: 89,
        createdAt: '5시간 전',
    },
    {
        id: 3,
        region: '안양시 동안구',
        isOfficial: true,
        title: '평촌 중앙공원 주말 프리마켓 운영 정례화',
        description: '지역 소상공인 지원과 시민 문화 생활 향상을 위해 주말 프리마켓을 정례화하고자 합니다. 합리적인 운영 방안을 논의합니다.',
        participants: 256,
        createdAt: '2026.01.01',
    },
    {
        id: 4,
        region: '용인시 수지구',
        isOfficial: false,
        title: '수지 고기동 계곡 도로 확장 및 인도 설치',
        description: '유동 인구에 비해 도로가 너무 좁고 인도가 없어 사고 위험이 큽니다. 도로 확장 및 보행로 확보 이슈를 다뤄봅시다.',
        participants: 45,
        createdAt: '3일 전',
    },
    {
        id: 5,
        region: '고양시 일산동구',
        isOfficial: true,
        title: '일산 호수공원 쓰레기 분리배축함 디자인 개선',
        description: '아름다운 호수공원 경관에 어울리면서도 효율적인 분리배출이 가능한 디자인을 공모합니다. 시민분들의 디자인 아이디어를 찾습니다.',
        participants: 67,
        createdAt: '2025.12.30',
    },
    {
        id: 6,
        region: '화성시 동탄',
        isOfficial: false,
        title: '동탄역 인근 복합 문화시설 유치 서명 운동',
        description: '동탄 지역 문화 인프라 확충을 위한 복합 문화시설 건립 필요성을 공유하고, 관계 부처에 전달할 시민 의견을 모으고 있습니다.',
        participants: 312,
        createdAt: '1주 전',
    },
];

interface RoomListSectionProps {
    activeTab: 'all' | 'joined';
}

const RoomListSection: React.FC<RoomListSectionProps> = ({ activeTab }) => {
    const filteredRooms = activeTab === 'all'
        ? MOCK_ROOMS
        : MOCK_ROOMS.filter(r => r.id % 2 === 0);

    return (
        <section className="py-16 md:py-24 bg-neutral-50">
            <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-800">
                                {activeTab === 'all' ? '실시간 인기 토의실' : '내가 참여 중인 토의실'}
                            </h2>
                            <button className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg bg-white text-sm text-neutral-600 hover:bg-neutral-100 transition-colors">
                                최신순
                                <ChevronDown size={16} />
                            </button>
                        </div>
                        <p className="text-neutral-500">
                            {activeTab === 'all' ? (
                                <>지금 이슈가 되고 있는 <span className="text-primary-500 font-semibold">{filteredRooms.length}</span>개의 토의가 진행 중입니다.</>
                            ) : (
                                <>현재 <span className="text-primary-500 font-semibold">{filteredRooms.length}</span>개의 토의에 참여하고 있습니다.</>
                            )}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.map((room) => (
                            <RoomCard key={room.id} {...room} />
                        ))}
                    </div>

                    <div className="flex justify-center mt-8">
                        <nav className="flex items-center gap-2">
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 disabled:opacity-50" disabled>
                                &lt;
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-primary-500 bg-primary-50 text-primary-600 font-semibold">
                                1
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50">
                                2
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50">
                                3
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400">
                                &gt;
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RoomListSection;
