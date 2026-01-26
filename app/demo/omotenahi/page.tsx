'use client';

import React, { useState } from 'react';
import { OmotenahiAlert } from '@/components/ui/OmotenahiAlert';
import { OMOTENASHI_MESSAGES } from '@/lib/omotenashiMessages';

export default function OmotenahiDemoPage() {
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

    const dismiss = (id: string) => {
        setDismissedAlerts(prev => new Set(prev).add(id));
    };

    const reset = () => {
        setDismissedAlerts(new Set());
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-800">おもてなしアラート デモ</h1>
                    <button
                        onClick={reset}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-bold transition-colors"
                    >
                        リセット
                    </button>
                </div>

                {/* Error Examples */}
                <section>
                    <h2 className="text-lg font-bold text-slate-700 mb-4">エラー (Error)</h2>
                    <div className="space-y-4">
                        {!dismissedAlerts.has('error1') && (
                            <OmotenahiAlert
                                type="error"
                                title={OMOTENASHI_MESSAGES.ERROR.VALIDATION_FAILED.title}
                                message={OMOTENASHI_MESSAGES.ERROR.VALIDATION_FAILED.message}
                                action={{ label: '入力を確認する', onClick: () => alert('入力画面へ') }}
                                onDismiss={() => dismiss('error1')}
                            />
                        )}
                        {!dismissedAlerts.has('error2') && (
                            <OmotenahiAlert
                                type="error"
                                title={OMOTENASHI_MESSAGES.ERROR.NETWORK_ERROR.title}
                                message={OMOTENASHI_MESSAGES.ERROR.NETWORK_ERROR.message}
                                action={{ label: 'もう一度試す', onClick: () => alert('再試行') }}
                                onDismiss={() => dismiss('error2')}
                            />
                        )}
                    </div>
                </section>

                {/* Warning Examples */}
                <section>
                    <h2 className="text-lg font-bold text-slate-700 mb-4">警告 (Warning)</h2>
                    <div className="space-y-4">
                        {!dismissedAlerts.has('warning1') && (
                            <OmotenahiAlert
                                type="warning"
                                title={OMOTENASHI_MESSAGES.WARNING.UNSAVED_CHANGES.title}
                                message={OMOTENASHI_MESSAGES.WARNING.UNSAVED_CHANGES.message}
                                action={{ label: '保存する', onClick: () => alert('保存しました') }}
                                onDismiss={() => dismiss('warning1')}
                            />
                        )}
                    </div>
                </section>

                {/* Success Examples */}
                <section>
                    <h2 className="text-lg font-bold text-slate-700 mb-4">成功 (Success)</h2>
                    <div className="space-y-4">
                        {!dismissedAlerts.has('success1') && (
                            <OmotenahiAlert
                                type="success"
                                title={OMOTENASHI_MESSAGES.SUCCESS.KNOWLEDGE_SAVED.title}
                                message={OMOTENASHI_MESSAGES.SUCCESS.KNOWLEDGE_SAVED.message}
                                onDismiss={() => dismiss('success1')}
                            />
                        )}
                    </div>
                </section>

                {/* Info Examples */}
                <section>
                    <h2 className="text-lg font-bold text-slate-700 mb-4">情報 (Info)</h2>
                    <div className="space-y-4">
                        {!dismissedAlerts.has('info1') && (
                            <OmotenahiAlert
                                type="info"
                                title={OMOTENASHI_MESSAGES.INFO.FIRST_TIME.title}
                                message={OMOTENASHI_MESSAGES.INFO.FIRST_TIME.message}
                                onDismiss={() => dismiss('info1')}
                            />
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
