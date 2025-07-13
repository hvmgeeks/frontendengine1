import React from 'react';
import { TbAlertTriangle, TbRefresh, TbHome } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';

class QuizErrorBoundary extends React.Component {
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
    
    // Log error to console for debugging
    console.error('Quiz Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <QuizErrorFallback 
        error={this.state.error} 
        resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
      />;
    }

    return this.props.children;
  }
}

const QuizErrorFallback = ({ error, resetError }) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    resetError();
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/user/hub');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <TbAlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Oops! Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-6">
          We encountered an error while loading the quiz. This might be a temporary issue.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <TbRefresh className="w-5 h-5" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <TbHome className="w-5 h-5" />
            <span>Go to Hub</span>
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default QuizErrorBoundary;
