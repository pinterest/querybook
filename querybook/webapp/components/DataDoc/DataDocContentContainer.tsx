import React, { useState, useCallback } from 'react';
import { useResizeObserver } from 'hooks/useResizeObserver';

const isChrome = /chrome/.test(navigator.userAgent.toLowerCase());

export const DataDocContentContainer: React.FunctionComponent = isChrome
    ? ({ children }) => {
          // This whole thing is required because of a chrome bug
          // since v73 when codemirror measures its width the page slows due to
          // forced reflow because flexbox is smaller than its flex-basis
          // The solution is to have a inner div that is the same width as the flex
          // div
          const [containerWidth, setContainerWidth] = useState(1200);
          const selfRef = React.useRef<HTMLDivElement>(null);

          useResizeObserver(
              selfRef.current,
              useCallback((entries) => {
                  for (const entry of entries) {
                      if (entry.contentRect) {
                          setContainerWidth(entry.contentRect.width);
                      }
                  }
              }, []),
              useCallback(
                  () => setContainerWidth(selfRef.current.offsetWidth),
                  []
              )
          );

          return (
              <div ref={selfRef} className="data-doc-content-container">
                  <div style={{ maxWidth: `${containerWidth}px` }}>
                      {children}
                  </div>
              </div>
          );
      }
    : ({ children }) => (
          <div className="data-doc-content-container">{children}</div>
      );
