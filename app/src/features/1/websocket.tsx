// context/WebSocketContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface WebSocketContextType {
    socket: WebSocket | null;
    sendMessage: (message: string) => void;
    loginMessages: string[];
    disconnectMessages: string[];
    positionMessages: string[];
    chatMessages: string[];
    settingMessages: string[];
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    // メッセージのカテゴリごとの状態
    const [chatMessages, setChatMessages] = useState<string[]>([]);
    const [settingMessages, setSettingMessages] = useState<string[]>([]);
    const [positionMessages, setPositionMessages] = useState<string[]>([]);
    const [loginMessages, setLoginMessages] = useState<string[]>([]);
    const [disconnectMessages, setDisconnectMessages] = useState<string[]>([]);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3001');
        setSocket(ws);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        // メッセージの分類処理
        ws.onmessage = (event) => {
            console.log('Message from server:', event.data);
            const message = JSON.parse(event.data);

            // 例えば、メッセージの種類に応じてカテゴリに分ける
            if (message.type === "login") {
                setLoginMessages((prevMessages) => [...prevMessages, message]);
            }else if(message.type === "disconnect"){
                setDisconnectMessages((prevMessages) => [...prevMessages, message]);
            }else if(message.type === "position"){
                setPositionMessages((prevMessages) => [...prevMessages, message]);
            }else if(message.type === "chat"){
                setChatMessages((prevMessages) => [...prevMessages, message]);
            }else if(message.type === "setting"){
                setSettingMessages((prevMessages) => [...prevMessages, message]);
            }
        };

        ws.onerror = (error) => console.error('WebSocket error:', error);
        ws.onclose = () => console.log('WebSocket disconnected');

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, []);

    const sendMessage = (message: string) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(message);
            console.log('Sent message:', message);
        } else {
            console.error('WebSocket is not open');
        }
    };

    return (
        <WebSocketContext.Provider
            value={{
                socket,
                sendMessage,
                chatMessages,
                disconnectMessages,
                positionMessages,
                loginMessages,
                settingMessages,
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
