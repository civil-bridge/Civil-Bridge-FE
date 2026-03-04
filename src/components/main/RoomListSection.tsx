import React, { useState } from 'react';
import RoomCard from './RoomCard';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getTotalRooms, getMyJoinedRooms } from '../../api/room';
import { useAuthStore } from '../../store/authStore';

interface RoomListSectionProps {
    activeTab: 'all' | 'joined';
}

const RoomListSection: React.FC<RoomListSectionProps> = ({ activeTab }) => {
    const [page, setPage] = useState(1);
    const size = 9;
    const { isAuthenticated } = useAuthStore();

    // Reset page to 1 when tab changes
    React.useEffect(() => {
        setPage(1);
    }, [activeTab]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['rooms', activeTab, page, size, isAuthenticated],
        queryFn: async () => {
            if (activeTab === 'joined') {
                if (!isAuthenticated) return null;
                return getMyJoinedRooms(page, size);
            }
            return getTotalRooms(page, size);
        },
        enabled: activeTab === 'all' || isAuthenticated,
        placeholderData: keepPreviousData,
    });

    const roomData = data?.data;
    const filteredRooms = roomData?.rooms || [];
    const totalPages = roomData?.totalPages || 1;
    const totalCount = roomData?.totalCount || 0;

    // Calculate which page numbers to show (max 5 buttons)
    const MAX_VISIBLE_PAGES = 5;
    let startPage = Math.max(1, page - Math.floor(MAX_VISIBLE_PAGES / 2));
    const endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);

    if (endPage - startPage + 1 < MAX_VISIBLE_PAGES) {
        startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
    }

    const visiblePages = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
    );

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
                                <>지금 이슈가 되고 있는 <span className="text-primary-500 font-semibold">{totalCount}</span>개의 토의가 진행 중입니다.</>
                            ) : (
                                !isAuthenticated ? (
                                    <>참여 중인 토의를 보려면 로그인이 필요합니다.</>
                                ) : (
                                    <>현재 <span className="text-primary-500 font-semibold">{totalCount}</span>개의 토의에 참여하고 있습니다.</>
                                )
                            )}
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                        </div>
                    ) : isError || (activeTab === 'joined' && !isAuthenticated) ? (
                        <div className="flex justify-center items-center py-20 text-neutral-500">
                            {!isAuthenticated ? '로그인 후 이용 가능합니다.' : '데이터를 불러오는 중 오류가 발생했습니다.'}
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="flex justify-center items-center py-20 text-neutral-500">
                            진행 중인 토의방이 없습니다.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRooms.map((room) => (
                                <RoomCard key={room.roomId} {...room} />
                            ))}
                        </div>
                    )}

                    {!isLoading && totalPages > 0 && (
                        <div className="flex justify-center mt-8">
                            <nav className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    &lt;
                                </button>

                                {visiblePages.map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors ${pageNum === page
                                            ? 'border-primary-500 bg-primary-50 text-primary-600'
                                            : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    &gt;
                                </button>
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default RoomListSection;
