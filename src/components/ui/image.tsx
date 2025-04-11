'use client';

import NextImage, { ImageProps as NextImageProps } from 'next/image';
import { useState } from 'react';

export interface OptimizedImageProps extends NextImageProps {
    fallbackSrc?: string;
}

/**
 * Composant d'image optimisé avec chargement paresseux par défaut
 * et gestion des erreurs de chargement
 */
export function OptimizedImage({
    src,
    alt,
    fallbackSrc = '/placeholder.png',
    loading = 'lazy',
    ...props
}: OptimizedImageProps) {
    const [imgSrc, setImgSrc] = useState<string | typeof src>(src);
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={`relative ${isLoading ? 'bg-muted animate-pulse' : ''}`}>
            <NextImage
                src={imgSrc}
                alt={alt}
                loading={loading}
                {...props}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setImgSrc(fallbackSrc);
                    setIsLoading(false);
                }}
                className={`
          ${props.className || ''}
          ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}
        `}
            />
        </div>
    );
} 