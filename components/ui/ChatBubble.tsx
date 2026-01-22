import React from 'react';
import { Message } from '@/types';

interface ChatBubbleProps {
    message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${isUser
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-none'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-md'
                    }`}
            >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
};
