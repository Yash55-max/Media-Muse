'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show install button
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowInstallPrompt(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const handleDismiss = () => {
        setShowInstallPrompt(false);
    };

    if (!showInstallPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-card border rounded-lg shadow-lg p-4 max-w-sm flex items-start gap-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">Install Media Muse</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                        Install this app on your device for quick access and offline use
                    </p>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleInstallClick}
                            className="flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Install App
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDismiss}
                        >
                            Not Now
                        </Button>
                    </div>
                </div>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={handleDismiss}
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
