'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const Form = React.forwardRef<
    HTMLFormElement,
    React.FormHTMLAttributes<HTMLFormElement> & {
        onSubmit?: React.FormEventHandler<HTMLFormElement>;
    }
>(({ className, ...props }, ref) => (
    <form
        ref={ref}
        className={cn('space-y-4', className)}
        {...props}
    />
));
Form.displayName = 'Form';

const FormItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('space-y-2', className)}
        {...props}
    />
));
FormItem.displayName = 'FormItem';

const FormLabel = React.forwardRef<
    HTMLLabelElement,
    React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            className
        )}
        {...props}
    />
));
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => (
    <div ref={ref} className="mt-1" {...props} />
));
FormControl.displayName = 'FormControl';

const FormMessage = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
    if (!children) return null;

    return (
        <p
            ref={ref}
            className={cn('text-sm font-medium text-destructive', className)}
            {...props}
        >
            {children}
        </p>
    );
});
FormMessage.displayName = 'FormMessage';

const FormField = ({
    control,
    name,
    render,
}: {
    control: any;
    name: string;
    render: ({
        field,
    }: {
        field: {
            name: string;
            onChange: (value: any) => void;
            value: any;
            ref: React.Ref<any>;
        };
    }) => React.ReactNode;
}) => {
    return render({
        field: {
            name,
            onChange: () => { },
            value: '',
            ref: () => { },
        },
    });
};

export {
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormField,
};

