import { useState, useEffect, useCallback, useRef } from 'react';
import useResponsive from './useResponsive';

const useMobileScrollOptimization = (containerRef, options = {}) => {
  const { isMobile } = useResponsive();
  const [scrollState, setScrollState] = useState({
    isAtTop: true,
    isAtBottom: true,
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  });
  
  const [showScrollIndicators, setShowScrollIndicators] = useState({
    top: false,
    bottom: false,
  });

  const scrollTimeoutRef = useRef(null);
  const lastScrollTop = useRef(0);
  const scrollDirection = useRef('down');

  const {
    threshold = 100,
    debounceMs = 16,
    enableScrollIndicators = true,
    onScrollToTop,
    onScrollToBottom,
    onScrollDirectionChange,
  } = options;

  // Handle scroll events with debouncing
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // Determine scroll direction
    const currentDirection = scrollTop > lastScrollTop.current ? 'down' : 'up';
    if (currentDirection !== scrollDirection.current) {
      scrollDirection.current = currentDirection;
      onScrollDirectionChange?.(currentDirection);
    }
    lastScrollTop.current = scrollTop;

    // Calculate scroll positions
    const isAtTop = scrollTop <= threshold;
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= threshold;

    // Update scroll state
    setScrollState({
      isAtTop,
      isAtBottom,
      scrollTop,
      scrollHeight,
      clientHeight,
    });

    // Update scroll indicators
    if (enableScrollIndicators) {
      setShowScrollIndicators({
        top: !isAtTop && scrollTop > threshold * 2,
        bottom: !isAtBottom && scrollHeight > clientHeight,
      });
    }

    // Trigger callbacks
    if (isAtTop && onScrollToTop) {
      onScrollToTop();
    }
    if (isAtBottom && onScrollToBottom) {
      onScrollToBottom();
    }
  }, [
    containerRef,
    threshold,
    enableScrollIndicators,
    onScrollToTop,
    onScrollToBottom,
    onScrollDirectionChange,
  ]);

  // Debounced scroll handler
  const debouncedHandleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(handleScroll, debounceMs);
  }, [handleScroll, debounceMs]);

  // Smooth scroll to top
  const scrollToTop = useCallback((behavior = 'smooth') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior,
      });
    }
  }, [containerRef]);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
  }, [containerRef]);

  // Scroll to specific element
  const scrollToElement = useCallback((element, options = {}) => {
    if (!element || !containerRef.current) return;

    const {
      behavior = 'smooth',
      block = 'nearest',
      inline = 'nearest',
      offset = 0,
    } = options;

    // Calculate position with offset
    const elementRect = element.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const scrollTop = containerRef.current.scrollTop;
    
    const targetScrollTop = scrollTop + elementRect.top - containerRect.top - offset;

    containerRef.current.scrollTo({
      top: targetScrollTop,
      behavior,
    });
  }, [containerRef]);

  // Auto-scroll to bottom when new content is added (if user is at bottom)
  const autoScrollToBottom = useCallback((force = false) => {
    if (force || scrollState.isAtBottom) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        scrollToBottom('auto');
      });
    }
  }, [scrollState.isAtBottom, scrollToBottom]);

  // Handle viewport changes (orientation, keyboard)
  useEffect(() => {
    if (!isMobile) return;

    const handleViewportChange = () => {
      // Delay to allow for keyboard animation
      setTimeout(() => {
        if (scrollState.isAtBottom) {
          scrollToBottom('auto');
        }
      }, 300);
    };

    const handleOrientationChange = () => {
      // Recalculate scroll position after orientation change
      setTimeout(handleScroll, 500);
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isMobile, scrollState.isAtBottom, scrollToBottom, handleScroll]);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', debouncedHandleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', debouncedHandleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [debouncedHandleScroll]);

  // iOS Safari specific fixes
  useEffect(() => {
    if (!isMobile) return;

    const container = containerRef.current;
    if (!container) return;

    // Prevent bounce scrolling
    const preventBounce = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      if (scrollTop === 0 && e.deltaY < 0) {
        e.preventDefault();
      }
      
      if (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0) {
        e.preventDefault();
      }
    };

    container.addEventListener('wheel', preventBounce, { passive: false });
    container.addEventListener('touchmove', preventBounce, { passive: false });

    return () => {
      container.removeEventListener('wheel', preventBounce);
      container.removeEventListener('touchmove', preventBounce);
    };
  }, [isMobile]);

  return {
    scrollState,
    showScrollIndicators,
    scrollDirection: scrollDirection.current,
    scrollToTop,
    scrollToBottom,
    scrollToElement,
    autoScrollToBottom,
    isScrolling: scrollTimeoutRef.current !== null,
  };
};

export default useMobileScrollOptimization;