import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
    children: React.ReactNode;
}

/**
 * Renders modal content at the document body level and locks background scrolling
 * so dialogs stay centered in the current viewport regardless of page height.
 */
const ModalPortal: React.FC<ModalPortalProps> = ({ children }) => {
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    return createPortal(children, document.body);
};

export default ModalPortal;
