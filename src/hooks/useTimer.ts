import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerProps {
    initialSeconds: number;
    onExpire?: () => void;
}

export const useTimer = ({ initialSeconds, onExpire }: UseTimerProps) => {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const start = useCallback(() => {
        setIsRunning(true);
    }, []);

    const reset = useCallback((newSeconds?: number) => {
        setTimeLeft(newSeconds ?? initialSeconds);
        setIsRunning(false);
    }, [initialSeconds]);

    const stop = useCallback(() => {
        setIsRunning(false);
    }, []);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
            onExpire?.();
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, timeLeft, onExpire]);

    const formattedTime = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60)
        .toString()
        .padStart(2, '0')}`;

    return {
        timeLeft,
        formattedTime,
        isRunning,
        start,
        stop,
        reset,
        isExpired: timeLeft === 0,
    };
};
