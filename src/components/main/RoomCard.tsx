import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Lock, ChevronRight } from 'lucide-react';
import Button from '../common/Button';

interface RoomCardProps {
    roomId: number;
    city: string;
    district: string;
    accessLevel: string;
    title: string;
    description?: string;
    currentUsers: number;
    createdAt: string;
}

const TAG_COLORS = [
    { bg: '#F5D0FE', text: '#A21CAF' }, // Primary Pink
    { bg: '#E9D5FF', text: '#7C3AED' }, // Primary Lavender
    { bg: '#FFEDD5', text: '#EA580C' }, // Secondary Peach
    { bg: '#FEF3C7', text: '#CA8A04' }, // Secondary Yellow
    { bg: '#DBEAFE', text: '#2563EB' }, // Point Blue
    { bg: '#D1FAE5', text: '#059669' }, // Point Mint
];

const RoomCard: React.FC<RoomCardProps> = ({
    roomId,
    city,
    district,
    accessLevel,
    title,
    description,
    currentUsers,
    createdAt,
}) => {
    const navigate = useNavigate();

    // Get a consistent color based on the title
    const getColorForRoom = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % TAG_COLORS.length;
        return TAG_COLORS[index];
    };

    const tagColor = getColorForRoom(title);

    const handleCardClick = () => {
        navigate(`/room/${roomId}`);
    };

    return (
        <div
            className="group bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-primary-200 flex flex-col gap-4 h-[240px]"
        >
            <div className="flex items-center justify-between">
                <span
                    className="inline-flex px-3 py-1 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: tagColor.bg, color: tagColor.text }}
                >
                    {city} {district}
                </span>
                {accessLevel === 'OFFICIALS_ONLY' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B] rounded-lg text-xs font-medium">
                        <Lock size={12} />
                        공무원 전용
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <h3 className="text-neutral-800 font-semibold line-clamp-1 group-hover:text-primary-600 transition-colors">{title}</h3>
                <p className="text-neutral-500 text-sm line-clamp-3 leading-relaxed">
                    {description}
                </p>
            </div>

            <div className="mt-auto flex items-center justify-between pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-2 text-neutral-400 text-xs">
                    <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>{currentUsers}명 참여 중</span>
                    </div>
                    <span className="text-neutral-300">|</span>
                    <span>{createdAt}</span>
                </div>
                <Button
                    variant="ghost"
                    className="!p-0 !h-auto text-primary-500 font-semibold hover:bg-transparent flex items-center gap-0.5 group-hover:gap-1.5 transition-all cursor-pointer"
                    onClick={handleCardClick}
                >
                    입장하기 <ChevronRight size={16} />
                </Button>
            </div>
        </div>
    );
};

export default RoomCard;
