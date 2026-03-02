import { useEffect, useState, useCallback } from 'react';

const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    const handleResize = () => {
      if (isIOS) {
        // iOS: Use visualViewport API
        if (window.visualViewport) {
          const viewport = window.visualViewport;
          const keyboardHeight = window.innerHeight - viewport.height;
          
          setKeyboardHeight(keyboardHeight);
          setIsKeyboardVisible(keyboardHeight > 0);
        }
      } else {
        // Android: Use window resize
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.clientHeight;
        const keyboardHeight = documentHeight - windowHeight;
        
        setKeyboardHeight(Math.max(0, keyboardHeight));
        setIsKeyboardVisible(keyboardHeight > 100); // Threshold for keyboard
      }
    };

    // Listen to viewport changes (iOS)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }
    
    // Listen to window resize (Android)
    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible };
};

/**
 * Component wrapper that adjusts for keyboard
 */
export const KeyboardAwareInput = ({ children, style = {} }) => {
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();

  return (
    <div
      style={{
        ...style,
        transform: isKeyboardVisible ? `translateY(-${keyboardHeight}px)` : 'none',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
};

export default useKeyboardHeight;
