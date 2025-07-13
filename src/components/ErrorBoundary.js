import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Check for specific error types
    if (error.message && error.message.includes('Objects are not valid as a React child')) {
      console.error('🚨 FOUND THE OBJECT RENDERING ERROR!');
      console.error('This error is caused by trying to render an object directly in JSX');
      console.error('Look for patterns like {question} instead of {question.name}');
      console.error('Error stack:', error.stack);
    }

    // Check for style/DOM manipulation errors
    if (error.message && (
      error.message.includes('Cannot read properties of null') ||
      error.message.includes('Cannot read property \'style\'') ||
      error.message.includes('Cannot set property \'style\'')
    )) {
      console.error('🚨 FOUND DOM/STYLE MANIPULATION ERROR!');
      console.error('This error is caused by trying to access DOM elements that don\'t exist');
      console.error('Use React state and refs instead of direct DOM manipulation');
      console.error('Error stack:', error.stack);
    }

    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <div className="text-red-500 text-6xl mb-4 text-center">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Something went wrong
            </h2>
            <div className="text-gray-600 mb-4">
              <p className="mb-2">An error occurred while rendering the page.</p>
              {this.state.error && this.state.error.message.includes('Objects are not valid as a React child') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                  <p className="text-yellow-800 font-medium">🔍 Debug Info:</p>
                  <p className="text-yellow-700 text-sm mt-1">
                    This error is caused by trying to render an object directly in JSX. 
                    Check the browser console for more details.
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Show Error Details (Development)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
