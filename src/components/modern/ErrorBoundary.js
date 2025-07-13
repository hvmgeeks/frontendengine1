import React from 'react';
import { motion } from 'framer-motion';
import { TbAlertTriangle, TbRefresh, TbHome } from 'react-icons/tb';
import { Button, Card } from './index';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full"
          >
            <Card className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <TbAlertTriangle className="w-8 h-8 text-error-600" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Oops! Something went wrong
              </h2>
              
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. Don't worry, our team has been notified and we're working on a fix.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 rounded-lg text-xs font-mono text-gray-700 overflow-auto max-h-32">
                    <div className="font-bold text-error-600 mb-2">
                      {this.state.error.toString()}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </div>
                  </div>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="primary"
                  onClick={this.handleRetry}
                  icon={<TbRefresh />}
                >
                  Try Again
                </Button>
                <Button
                  variant="secondary"
                  onClick={this.handleGoHome}
                  icon={<TbHome />}
                >
                  Go Home
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional Error Fallback Component
export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <TbAlertTriangle className="w-8 h-8 text-error-600" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h2>
          
          <p className="text-gray-600 mb-6">
            {error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              onClick={resetErrorBoundary}
              icon={<TbRefresh />}
            >
              Try Again
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/'}
              icon={<TbHome />}
            >
              Go Home
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ErrorBoundary;
