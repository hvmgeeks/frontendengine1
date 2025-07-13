// Modern UI Components
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Input } from './Input';
export { default as Loading } from './Loading';

// Quiz Components
export { default as QuizCard } from './QuizCard';
export { default as QuizQuestion } from './QuizQuestion';
export { default as QuizTimer, QuizTimerOverlay } from './QuizTimer';

// Theme & Performance Components
export { default as ThemeToggle, ThemeSwitch, ThemeToggleWithLabel } from './ThemeToggle';
export { default as LazyImage } from './LazyImage';
export { default as ErrorBoundary, ErrorFallback } from './ErrorBoundary';

// Responsive Components
export {
  default as ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveText,
  MobileFirst,
  DesktopFirst,
  ResponsiveStack,
  ResponsiveShow
} from './ResponsiveContainer';

// Performance Components (PerformanceIndicator removed)
export {
  usePerformanceMonitor,
  LazyWrapper,
  OptimizedImage,
  useDebouncedSearch,
  VirtualList
} from './PerformanceMonitor';

// Theme Context
export { ThemeProvider, useTheme } from '../../contexts/ThemeContext';
