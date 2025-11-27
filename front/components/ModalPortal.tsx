import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

const MODAL_ROOT_ID = 'modal-root';

let openModalCount = 0;
let scrollPosition = { top: 0, left: 0 };
let previousBodyStyles: Partial<CSSStyleDeclaration> = {};

const ensureModalRoot = () => {
    let modalRoot = document.getElementById(MODAL_ROOT_ID);
    if (!modalRoot) {
        modalRoot = document.createElement('div');
        modalRoot.id = MODAL_ROOT_ID;
        document.body.appendChild(modalRoot);
    }
    return modalRoot;
};

const lockBodyScroll = () => {
    const { style } = document.body;
    previousBodyStyles = {
        overflow: style.overflow,
        position: style.position,
        top: style.top,
        left: style.left,
        right: style.right,
        width: style.width,
    };

    scrollPosition = {
        top: window.scrollY || document.documentElement.scrollTop,
        left: window.scrollX || document.documentElement.scrollLeft,
    };

    style.overflow = 'hidden';
    style.position = 'fixed';
    style.top = `-${scrollPosition.top}px`;
    style.left = '0';
    style.right = '0';
    style.width = '100%';
};

const restoreBodyScroll = () => {
    const { style } = document.body;
    style.overflow = previousBodyStyles.overflow || '';
    style.position = previousBodyStyles.position || '';
    style.top = previousBodyStyles.top || '';
    style.left = previousBodyStyles.left || '';
    style.right = previousBodyStyles.right || '';
    style.width = previousBodyStyles.width || '';
    window.scrollTo(scrollPosition.left, scrollPosition.top);
};

interface ModalPortalProps {
    children: React.ReactNode;
}

/**
 * Renders modal content at a dedicated body-level portal and locks background scrolling
 * so dialogs stay centered in the current viewport regardless of page height.
 */
const ModalPortal: React.FC<ModalPortalProps> = ({ children }) => {
    const modalElement = useMemo(() => document.createElement('div'), []);

    useEffect(() => {
        const modalRoot = ensureModalRoot();
        modalRoot.appendChild(modalElement);

        openModalCount += 1;
        if (openModalCount === 1) {
            lockBodyScroll();
        }

        return () => {
            modalRoot.removeChild(modalElement);
            openModalCount -= 1;
            if (openModalCount === 0) {
                restoreBodyScroll();
            }
        };
    }, [modalElement]);

    return createPortal(children, modalElement);
};

export default ModalPortal;
