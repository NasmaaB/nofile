'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import {
    ChevronLeft,
    Download,
    Share2,
    Copy,
    Check,
    Palette,
    Image as ImageIcon,
    X,
    Loader2,
    Settings2,
    Info
} from 'lucide-react';

import { useQueue } from '@/context/queue-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HexColorPicker } from 'react-colorful';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function QrCodePage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { queues } = useQueue();
    const qrCodeRef = useRef<HTMLDivElement>(null);

    // État pour le QR Code
    const [loading, setLoading] = useState(true);
    const [queue, setQueue] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [qrValue, setQrValue] = useState<string>('');
    const [isMounted, setIsMounted] = useState(false);
    const [copied, setCopied] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    // Options de personnalisation
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#FFFFFF');
    const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('L');
    const [size, setSize] = useState(200);
    const [logoUrl, setLogoUrl] = useState('');
    const [logoSize, setLogoSize] = useState(50);
    const [showColorPicker, setShowColorPicker] = useState<'fg' | 'bg' | null>(null);
    const [showLogo, setShowLogo] = useState(false);

    // Récupérer l'ID de la file d'attente depuis l'URL
    const queueId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

    // Détecter la taille d'écran
    useEffect(() => {
        const checkScreenSize = () => {
            setIsSmallScreen(window.innerWidth < 768);

            // Ajuster la taille du QR code sur les petits écrans
            if (window.innerWidth < 768 && size > 180) {
                setSize(Math.min(180, Math.floor(window.innerWidth * 0.5)));
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Charger la file d'attente
    useEffect(() => {
        if (!queueId) {
            setError('Identifiant de file d\'attente invalide');
            setLoading(false);
            return;
        }

        const selectedQueue = queues.find(q => q.id === queueId);

        if (selectedQueue) {
            setQueue(selectedQueue);
            setQrValue(selectedQueue.publicUrl || '');
            setLoading(false);

            // Charger le logo si disponible dans les paramètres
            if (selectedQueue.settings?.logoUrl) {
                setLogoUrl(selectedQueue.settings.logoUrl);
                setShowLogo(true);
            }
        } else {
            setError('File d\'attente introuvable');
            setLoading(false);
        }

        // Marquer le composant comme monté pour les animations
        setTimeout(() => setIsMounted(true), 100);
    }, [queueId, queues]);

    // Copier le lien public
    const handleCopyLink = () => {
        if (!qrValue) return;

        navigator.clipboard.writeText(qrValue);
        setCopied(true);

        toast({
            title: "Lien copié !",
            description: "L'URL publique a été copiée dans le presse-papier",
        });

        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    // Partager la file d'attente
    const handleShare = () => {
        if (!qrValue) return;

        if (navigator.share) {
            navigator.share({
                title: `File d'attente: ${queue?.name || 'File d\'attente'}`,
                text: `Rejoignez la file d'attente en scannant le QR code ou en cliquant sur le lien`,
                url: qrValue
            }).catch(() => {
                handleCopyLink();
            });
        } else {
            handleCopyLink();
        }
    };

    // Télécharger le QR code
    const handleDownload = async () => {
        if (!qrCodeRef.current) return;

        try {
            setGenerating(true);

            const dataUrl = await toPng(qrCodeRef.current, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: bgColor
            });

            const link = document.createElement('a');
            link.download = `qrcode-${queue?.name || 'file'}.png`;
            link.href = dataUrl;
            link.click();

            toast({
                title: "QR Code téléchargé !",
                description: "Le QR Code a été téléchargé avec succès",
            });
        } catch (err) {
            console.error('Erreur lors du téléchargement du QR Code:', err);
            toast({
                title: "Erreur",
                description: "Impossible de télécharger le QR Code",
                variant: "destructive",
            });
        } finally {
            setGenerating(false);
        }
    };

    // Animations
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 15, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 25,
                mass: 0.5
            }
        }
    };

    // Afficher un message de chargement
    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Chargement du QR Code...</p>
            </div>
        );
    }

    // Afficher un message d'erreur
    if (error || !queue) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center max-w-md mx-auto mt-8"
            >
                <X className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-destructive">Erreur</h2>
                <p className="text-muted-foreground">{error || 'Une erreur s\'est produite'}</p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push('/dashboard/queues')}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Retour aux files d'attente
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate={isMounted ? "visible" : "hidden"}
            variants={containerVariants}
            className="space-y-4 pb-6 px-2 sm:px-4"
        >
            {/* Back button (sticky header) */}
            <motion.div variants={itemVariants} className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 -mt-2 pt-2 pb-3">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="px-2"
                        onClick={() => router.push(`/dashboard/queues/${queueId}`)}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Retour à la file d'attente</span>
                        <span className="sm:hidden">Retour</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        disabled={generating}
                    >
                        {generating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        <span>Télécharger</span>
                    </Button>
                </div>
            </motion.div>

            {/* Contenu principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* QR Code Preview */}
                <motion.div variants={itemVariants}>
                    <Card className="p-4 sm:p-6 flex flex-col items-center justify-center h-full">
                        <CardHeader className="p-0 pb-4 text-center w-full">
                            <CardTitle className="text-lg sm:text-xl">QR Code de la file</CardTitle>
                            <CardDescription>
                                {queue.name}
                                <Badge variant="outline" className="ml-2 h-5 px-1.5 text-[10px]">
                                    {queue.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 w-full flex flex-col items-center justify-center">
                            <div
                                ref={qrCodeRef}
                                className="p-4 sm:p-6 rounded-lg mb-4 flex items-center justify-center"
                                style={{ backgroundColor: bgColor }}
                            >
                                <div className="relative">
                                    <QRCodeSVG
                                        value={qrValue || 'https://example.com'}
                                        size={size}
                                        bgColor={bgColor}
                                        fgColor={fgColor}
                                        level={level}
                                        includeMargin={false}
                                    />
                                    {showLogo && logoUrl && (
                                        <div
                                            className="absolute inset-0 flex items-center justify-center"
                                            style={{
                                                backgroundColor: 'transparent',
                                            }}
                                        >
                                            <div
                                                className="rounded-md overflow-hidden bg-white flex items-center justify-center"
                                                style={{
                                                    width: `${logoSize}px`,
                                                    height: `${logoSize}px`,
                                                    padding: '4px',
                                                }}
                                            >
                                                <img
                                                    src={logoUrl}
                                                    alt="Logo"
                                                    style={{
                                                        maxWidth: '100%',
                                                        maxHeight: '100%',
                                                        objectFit: 'contain'
                                                    }}
                                                    onError={() => {
                                                        setShowLogo(false);
                                                        setLogoUrl('');
                                                        toast({
                                                            title: "Erreur de chargement",
                                                            description: "Impossible de charger le logo",
                                                            variant: "destructive",
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-0 pt-4 w-full">
                            <div className="w-full flex flex-col space-y-3">
                                <div className="bg-muted/40 p-2 rounded-md font-mono text-xs overflow-hidden flex items-center">
                                    <span className="truncate flex-1">{qrValue || 'https://example.com'}</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 ml-1 shrink-0"
                                                    onClick={handleCopyLink}
                                                >
                                                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Copier le lien</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={handleShare}
                                    >
                                        <Share2 className="h-4 w-4 mr-2" />
                                        <span>Partager</span>
                                    </Button>
                                    <Button
                                        variant="gradient"
                                        size="sm"
                                        className="flex-1"
                                        onClick={handleDownload}
                                        disabled={generating}
                                    >
                                        {generating ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4 mr-2" />
                                        )}
                                        <span>Télécharger</span>
                                    </Button>
                                </div>
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>

                {/* QR Code Customization */}
                <motion.div variants={itemVariants}>
                    <Card className="h-full">
                        <CardHeader className="pb-2 p-4">
                            <CardTitle className="text-lg flex items-center">
                                <Settings2 className="h-4 w-4 mr-2 text-primary" />
                                Personnalisation
                            </CardTitle>
                            <CardDescription>
                                Modifiez l'apparence de votre QR code
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2 p-4">
                            <Tabs defaultValue="colors">
                                <TabsList className="grid grid-cols-3 mb-4 w-full">
                                    <TabsTrigger value="colors">Couleurs</TabsTrigger>
                                    <TabsTrigger value="size">Taille</TabsTrigger>
                                    <TabsTrigger value="logo">Logo</TabsTrigger>
                                </TabsList>

                                <TabsContent value="colors" className="space-y-4 mt-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium">Couleur QR Code</label>
                                            <Popover
                                                open={showColorPicker === 'fg'}
                                                onOpenChange={(open: boolean) => setShowColorPicker(open ? 'fg' : null)}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 relative"
                                                    >
                                                        <span
                                                            className="absolute inset-1 rounded-sm"
                                                            style={{ backgroundColor: fgColor }}
                                                        />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-3" sideOffset={5} align="end">
                                                    <HexColorPicker color={fgColor} onChange={setFgColor} />
                                                    <Input
                                                        value={fgColor}
                                                        onChange={(e) => setFgColor(e.target.value)}
                                                        className="mt-2 font-mono"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="grid grid-cols-6 gap-2">
                                            {['#000000', '#1E40AF', '#047857', '#B91C1C', '#7E22CE', '#0369A1'].map(color => (
                                                <button
                                                    key={color}
                                                    className={cn(
                                                        "h-8 rounded-md border-2",
                                                        fgColor === color ? "border-primary" : "border-transparent"
                                                    )}
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => setFgColor(color)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium">Couleur d'arrière-plan</label>
                                            <Popover
                                                open={showColorPicker === 'bg'}
                                                onOpenChange={(open: boolean) => setShowColorPicker(open ? 'bg' : null)}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 relative"
                                                    >
                                                        <span
                                                            className="absolute inset-1 rounded-sm"
                                                            style={{ backgroundColor: bgColor }}
                                                        />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-3" sideOffset={5} align="end">
                                                    <HexColorPicker color={bgColor} onChange={setBgColor} />
                                                    <Input
                                                        value={bgColor}
                                                        onChange={(e) => setBgColor(e.target.value)}
                                                        className="mt-2 font-mono"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="grid grid-cols-6 gap-2">
                                            {['#FFFFFF', '#F0F9FF', '#ECFDF5', '#FEF2F2', '#F5F3FF', '#F7F8FA'].map(color => (
                                                <button
                                                    key={color}
                                                    className={cn(
                                                        "h-8 rounded-md border-2",
                                                        bgColor === color ? "border-primary" : "border-transparent"
                                                    )}
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => setBgColor(color)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium flex items-center">
                                                Niveau de correction
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                                                        </TooltipTrigger>
                                                        <TooltipContent side={isSmallScreen ? "bottom" : "right"}>
                                                            <p className="max-w-xs text-xs">
                                                                Le niveau de correction détermine la capacité du QR code à être reconnu même s'il est partiellement endommagé.
                                                                Un niveau plus élevé est recommandé si vous ajoutez un logo.
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-4 gap-1 sm:gap-2">
                                            {[
                                                { value: 'L', label: 'Faible' },
                                                { value: 'M', label: 'Moyen' },
                                                { value: 'Q', label: 'Quartile' },
                                                { value: 'H', label: 'Haut' }
                                            ].map(option => (
                                                <Button
                                                    key={option.value}
                                                    variant={level === option.value ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="text-xs sm:text-sm px-1 sm:px-2"
                                                    onClick={() => setLevel(option.value as 'L' | 'M' | 'Q' | 'H')}
                                                >
                                                    {option.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="size" className="space-y-4 mt-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium">Taille du QR code</label>
                                            <span className="text-xs text-muted-foreground">{size}px</span>
                                        </div>
                                        <Slider
                                            value={[size]}
                                            min={100}
                                            max={isSmallScreen ? 220 : 300}
                                            step={10}
                                            onValueChange={(values: number[]) => setSize(values[0])}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="logo" className="space-y-3 mt-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="show-logo"
                                            checked={showLogo}
                                            onChange={(e) => setShowLogo(e.target.checked)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="show-logo" className="text-sm font-medium">
                                            Afficher un logo au centre
                                        </label>
                                    </div>

                                    {showLogo && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">URL du logo</label>
                                                <Input
                                                    value={logoUrl}
                                                    onChange={(e) => setLogoUrl(e.target.value)}
                                                    placeholder="https://example.com/logo.png"
                                                    className="text-sm"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Utilisez une image carrée avec un fond transparent
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium">Taille du logo</label>
                                                    <span className="text-xs text-muted-foreground">{logoSize}px</span>
                                                </div>
                                                <Slider
                                                    value={[logoSize]}
                                                    min={20}
                                                    max={Math.min(80, size / 3)}
                                                    step={5}
                                                    onValueChange={(values: number[]) => setLogoSize(values[0])}
                                                />
                                            </div>

                                            <div className="rounded-lg border p-3 bg-muted/20">
                                                <h4 className="text-sm font-medium flex items-center">
                                                    <Info className="h-4 w-4 mr-2 text-blue-500" />
                                                    Conseil
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Utilisez le niveau de correction "Haut" avec un logo pour assurer que le QR code reste lisible.
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}