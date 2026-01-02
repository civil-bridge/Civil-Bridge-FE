import React from 'react';
import { Users, Lock } from 'lucide-react';
import Button from '../common/Button';

interface RoomCardProps {
    region: string;
    isOfficial: boolean;
    title: string;
    description: string;
    participants: number;
}

const RoomCard: React.FC<RoomCardProps> = ({
    region,
    isOfficial,
    title,
    description,
    participants,
}) => {
    return (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-lg hover:border-primary-200 hover:-translate-y-0.5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <span className="inline-flex px-3 py-1 bg-secondary-100 text-secondary-500 rounded-lg text-xs font-medium">
                    {region}
                </span>
                {isOfficial && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B] rounded-lg text-xs font-medium">
                        <Lock size={12} />
                        공무원 전용
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <h3 className="text-neutral-800 font-semibold line-clamp-1">{title}</h3>
                <p className="text-neutral-500 text-sm line-clamp-2 leading-relaxed">
                    {description}
                </p>
            </div>

            <div className="mt-auto flex items-center justify-between pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-1.5 text-neutral-400">
                    <Users size={14} />
                    <span className="text-xs">{participants}명 참여 중</span>
                </div>
                <Button variant="ghost" className="!p-0 !h-auto text-primary-500 font-semibold hover:bg-transparent">
                    입장하기 →
                </Button>
            </div>
        </div>
    );
};

export default RoomCard;
