import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export function Dropdown({ trigger, children, align = 'right' }) {
    const [open, setOpen] = React.useState(false);
    const [position, setPosition] = React.useState({ top: 0, left: 0 });
    const triggerRef = React.useRef(null);
    const dropdownRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);

            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + window.scrollY + 8,
                    left: align === 'right' ? rect.right + window.scrollX - 192 : rect.left + window.scrollX
                });
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open, align]);

    return (
        <>
            <div className="relative inline-block text-left" ref={triggerRef}>
                <div onClick={() => setOpen(!open)}>
                    {trigger}
                </div>
            </div>

            {open && createPortal(
                <div
                    ref={dropdownRef}
                    className="w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                    style={{
                        position: 'absolute',
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        zIndex: 9999
                    }}
                >
                    <div className="py-1" onClick={() => setOpen(false)}>
                        {children}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export function DropdownItem({ onClick, children, variant = 'default', icon: Icon }) {
    const variants = {
        default: 'text-gray-700 hover:bg-gray-100',
        success: 'text-green-700 hover:bg-green-50',
        danger: 'text-red-700 hover:bg-red-50',
        warning: 'text-yellow-700 hover:bg-yellow-50',
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full text-left px-4 py-2 text-sm flex items-center space-x-2',
                variants[variant]
            )}
        >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{children}</span>
        </button>
    );
}
