'use client';

import React, { useState, useEffect } from 'react';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';

interface ResizablePanelProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  storageKey?: string;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 500,
  minLeftWidth = 300,
  maxLeftWidth = 800,
  storageKey = 'panelWidth',
}) => {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [windowWidth, setWindowWidth] = useState(0);

  // ローカルストレージから保存された幅を読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedWidth = localStorage.getItem(storageKey);
        if (savedWidth) {
          const parsedWidth = parseInt(savedWidth, 10);
          if (!isNaN(parsedWidth) && parsedWidth >= minLeftWidth && parsedWidth <= maxLeftWidth) {
            setLeftWidth(parsedWidth);
          }
        }
      } catch (e) {
        console.error('Failed to load panel width from localStorage:', e);
      }
    }
  }, [minLeftWidth, maxLeftWidth, storageKey]);

  useEffect(() => {
    // クライアントサイドでのみウィンドウ幅を取得
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleResize = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
    const newWidth = data.size.width;
    setLeftWidth(newWidth);
  };

  // リサイズ終了時にローカルストレージに保存
  const handleResizeStop = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
    try {
      localStorage.setItem(storageKey, String(data.size.width));
    } catch (e) {
      console.error('Failed to save panel width to localStorage:', e);
    }
  };

  return (
    <div className="flex w-full h-full overflow-hidden">
      {windowWidth > 0 && (
        <>
          <ResizableBox
            width={leftWidth}
            height={Infinity}
            minConstraints={[minLeftWidth, Infinity]}
            maxConstraints={[maxLeftWidth, Infinity]}
            axis="x"
            resizeHandles={['e']}
            onResize={handleResize}
            onResizeStop={handleResizeStop}
            handle={
              <div className="absolute right-0 top-0 h-full w-5 cursor-col-resize flex items-center justify-center hover:bg-blue-50 transition-colors">
                <div className="h-full flex flex-col items-center justify-center relative">
                  {/* 縦線 */}
                  <div className="w-1.5 h-full bg-gray-300 rounded-full absolute"></div>
                  {/* 中央のドットグループ */}
                  <div className="z-10 flex flex-col gap-1.5 bg-gray-600 px-1.5 py-2 rounded-lg shadow-sm">
                    {[...Array(3)].map((_, dotIndex) => (
                      <div key={dotIndex} className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    ))}
                  </div>
                </div>
              </div>
            }
            className="relative"
          >
            <div className="h-full overflow-auto pr-4">
              {leftPanel}
            </div>
          </ResizableBox>
          <div className="flex-1 h-full overflow-auto">
            {rightPanel}
          </div>
        </>
      )}
    </div>
  );
};

export default ResizablePanel; 