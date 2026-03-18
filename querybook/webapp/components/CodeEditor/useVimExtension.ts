import { getCM, vim } from '@replit/codemirror-vim';
import { ViewPlugin } from '@codemirror/view';
import { Extension } from '@uiw/react-codemirror';
import { useEffect, useMemo, useRef, useState } from 'react';

export type VimMode = 'normal' | 'insert' | 'visual' | null;

export function useVimExtension(enabled: boolean): {
    vimExtension: Extension[];
    vimMode: VimMode;
} {
    const [vimMode, setVimMode] = useState<VimMode>(enabled ? 'normal' : null);
    // Use a ref so the ViewPlugin closure always calls the latest setter
    const setVimModeRef = useRef(setVimMode);
    setVimModeRef.current = setVimMode;

    useEffect(() => {
        setVimMode(enabled ? 'normal' : null);
    }, [enabled]);

    const vimExtension = useMemo(() => {
        if (!enabled) {
            return [];
        }

        const modeListenerPlugin = ViewPlugin.fromClass(
            class {
                private cm: any;
                private handler: (e: {
                    mode: string;
                    subMode?: string;
                }) => void;

                constructor(view: any) {
                    // getCM returns the cm5-compat object set up by the vim() extension
                    this.cm = getCM(view);
                    if (this.cm) {
                        this.handler = (e) => {
                            const { mode } = e;
                            if (mode === 'insert' || mode === 'replace') {
                                setVimModeRef.current('insert');
                            } else if (mode === 'visual') {
                                setVimModeRef.current('visual');
                            } else {
                                setVimModeRef.current('normal');
                            }
                        };
                        this.cm.on('vim-mode-change', this.handler);
                    }
                }

                destroy() {
                    if (this.cm && this.handler) {
                        this.cm.off('vim-mode-change', this.handler);
                    }
                }
            }
        );

        return [vim(), modeListenerPlugin];
    }, [enabled]);

    return { vimExtension, vimMode };
}
