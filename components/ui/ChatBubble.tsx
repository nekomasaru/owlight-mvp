import React from 'react';
import { Message } from '@/types';

interface ChatBubbleProps {
    message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system'; // 将来的な拡張のため

    // OWLight Design Rules
    // AI (Owl): Sage bases (Green/Wisdom), Cream text if dark, or dark text on light sage
    // User: White/Cream with shadow

    return (
        <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="flex-shrink-0 mr-3 mt-1">
                    <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center overflow-hidden shadow-sm border-2 border-white">
                        <img src="/Mr.OWL.jpg" alt="Mr.OWL" className="w-full h-full object-cover" />
                    </div>
                </div>
            )}

            <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-sm transition-all hover:shadow-md ${isUser
                    ? 'bg-white border text-taupe rounded-br-sm border-warm-beige'
                    : 'bg-[#E8F5E8] text-taupe rounded-bl-sm border border-sage/20'
                    }`}
            >
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {message.content}
                </div>
            </div>
        </div>
    );
};
