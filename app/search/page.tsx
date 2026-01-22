'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

type SearchResult = {
    id: string;
    title: string;
    content: string;
    score: number;
};

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setResults([]);

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
                cache: 'no-store',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '検索中にエラーが発生しました');
            }

            const data = await response.json();
            setResults(data.results);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-800">庁内ナレッジ検索（試作）</h1>
                <p className="text-sm text-gray-500">
                    ※この検索結果は、チャットボットが回答を生成する際の「根拠（Source）」として活用する予定です（RAG化）。
                </p>
            </div>

            <Card className="p-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="キーワードを入力（例: DX, 生成AI）"
                        className="flex-grow"
                    />
                    <Button type="submit" disabled={isLoading || !query.trim()}>
                        {isLoading ? '検索中...' : '検索'}
                    </Button>
                </form>

                {isLoading && (
                    <p className="mt-4 text-center text-gray-500 text-sm animate-pulse">
                        検索中...
                    </p>
                )}

                {error && (
                    <p className="mt-4 text-center text-red-500 text-sm font-medium">
                        {error}
                    </p>
                )}
            </Card>

            {results.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700 ml-1">
                        検索結果（{results.length}件）
                    </h2>
                    <div className="space-y-3">
                        {results.map((result) => (
                            <Card key={result.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                <div className="space-y-2">
                                    <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">
                                        {result.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {result.content}
                                    </p>
                                    {/* [Expansion Point] 
                        RAG実装時には、このテキスト群をLLMのシステムプロンプトにコンテキストとして注入する。 
                    */}
                                    <div className="pt-2 text-xs text-blue-500 font-mono">
                                        Score: {result.score} (ID: {result.id})
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
