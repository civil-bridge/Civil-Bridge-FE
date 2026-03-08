import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { MessageItem, ChatMessagePayload } from '../types/message';

interface UseChatProps {
    roomId: number;
    userId: number;
}

export const useChat = ({ roomId, userId }: UseChatProps) => {
    const clientRef = useRef<Client | null>(null);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const baseUrl = import.meta.env.VITE_API_BASE_URL;

        const client = new Client({
            webSocketFactory: () => new SockJS(`${baseUrl}/gyeonggi_partners-chat`),
            connectHeaders: {
                Authorization: token ? `Bearer ${token}` : '',
            },
            reconnectDelay: 5000,
            onConnect: () => {
                setIsConnected(true);

                // 구독
                client.subscribe(`/topic/room.${roomId}`, (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    console.log('STOMP Received Format:', receivedMessage);
                    setMessages((prev) => [...prev, receivedMessage]);
                });

                // 입장 알림 발송
                client.publish({
                    destination: '/app/chat.addUser',
                    body: JSON.stringify({
                        type: 'JOIN',
                        content: '',
                        roomId,
                        userId
                    }),
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
        };
    }, [roomId, userId]);

    const sendMessage = useCallback((content: string) => {
        if (clientRef.current?.connected && content.trim() !== '') {
            const payload: ChatMessagePayload = {
                type: 'CHAT',
                content,
                roomId,
                userId,
            };
            clientRef.current.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify(payload),
            });
        }
    }, [roomId, userId]);

    const addPreviousMessages = useCallback((prevMessages: MessageItem[]) => {
        setMessages((prev) => [...prevMessages, ...prev]);
    }, []);

    return { messages, isConnected, sendMessage, addPreviousMessages };
};
