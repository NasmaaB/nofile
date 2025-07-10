'use client';

import React from 'react';
import Logo from '@/components/common/logo_small';

export default function QueueLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-[100dvh] flex flex-col bg-background">

            {children}
            <footer className="flex justify-center z-10">
                <Logo animated showText className="h-5" />
            </footer>
        </div>
    );
} 