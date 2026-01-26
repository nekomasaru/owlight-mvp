'use client';

import { FileText, Sparkles } from 'lucide-react';

interface KnowledgeDraft {
    title: string;
    content: string;
    tags: string[];
}

interface KnowledgeDraftCardProps {
    draft: KnowledgeDraft;
    onOpenModal: (draft: KnowledgeDraft) => void;
}

export default function KnowledgeDraftCard({ draft, onOpenModal }: KnowledgeDraftCardProps) {
    return (
        <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-800 mb-1">
                        💡 これは貴重な知恵ですね！
                    </p>
                    <p className="text-xs text-amber-700 mb-3">
                        ナレッジベースに登録して、他の職員とも共有しませんか？
                    </p>

                    <div className="bg-white/60 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-gray-800 mb-1">{draft.title}</p>
                        <p className="text-xs text-gray-600 line-clamp-2">{draft.content}</p>
                        {draft.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {draft.tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => onOpenModal(draft)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow"
                    >
                        <FileText className="w-4 h-4" />
                        <span>📝 ナレッジとして下書き作成</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
