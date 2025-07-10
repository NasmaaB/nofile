import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface LogoProps {
    className?: string;
    animated?: boolean;
    href?: string;
    showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
    className,
    animated = false,
    href = "/",
    showText = true,
}) => {
    const logoContent = (
        <div className={cn("flex items-center", className)}>
            {animated ? (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        duration: 0.5,
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                    }}
                    className="flex items-center"
                >
                    {/* Animated SVG */}
                    <svg
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-1 w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7"
                    >
                        <motion.path
                            d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z"
                            fill="url(#paint0_linear)"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                        />
                        <motion.path
                            d="M16 6C10.477 6 6 10.477 6 16C6 21.523 10.477 26 16 26"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
                        />
                        <motion.path
                            d="M20 12L24 16L20 20"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 1.2, ease: "easeInOut" }}
                        />
                        <defs>
                            <linearGradient id="paint0_linear" x1="2" y1="16" x2="30" y2="16" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#0CA5E9" />
                                <stop offset="1" stopColor="#F43F5E" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {showText && (
                        <motion.span
                            className="text-sm md:text-base lg:text-lg xl:text-xl font-bold nofile-text-gradient"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                        >
                            NoFile
                        </motion.span>
                    )}
                </motion.div>
            ) : (
                <div className="flex items-center">
                    {/* Static SVG */}
                    <svg
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8"
                    >
                        <path
                            d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z"
                            fill="url(#paint0_linear)"
                        />
                        <path
                            d="M16 6C10.477 6 6 10.477 6 16C6 21.523 10.477 26 16 26"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <path
                            d="M20 12L24 16L20 20"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <defs>
                            <linearGradient id="paint0_linear" x1="2" y1="16" x2="30" y2="16" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#0CA5E9" />
                                <stop offset="1" stopColor="#F43F5E" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {showText && (
                        <span className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold nofile-text-gradient">
                            NoFile
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="focus:outline-none">
                {logoContent}
            </Link>
        );
    }

    return logoContent;
};

export default Logo;
