import React, { useState } from 'react';
import ContentRenderer from './ContentRenderer';

const MathPreview = ({ text, showPreview = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!showPreview || !text) return null;

  return (
    <div className="mt-3 border border-blue-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium text-left hover:bg-blue-100 transition-colors flex items-center justify-between"
      >
        <span>📐 Math Preview</span>
        <span className="text-xs">
          {isExpanded ? '▼ Hide' : '▶ Show'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="p-3 bg-white border-t border-blue-200">
          <div className="text-sm text-gray-600 mb-2">How your math will appear:</div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded min-h-[60px]">
            <ContentRenderer text={text} />
          </div>
          
          {/* Quick examples */}
          <div className="mt-3 text-xs text-gray-500">
            <div className="font-medium mb-1">Quick examples:</div>
            <div className="space-y-1">
              <div>• <code>x^2</code> → <ContentRenderer text="\\(x^2\\)" /></div>
              <div>• <code>\\frac&#123;a&#125;&#123;b&#125;</code> → <ContentRenderer text="\\(\\frac{a}{b}\\)" /></div>
              <div>• <code>\\sqrt&#123;x&#125;</code> → <ContentRenderer text="\\(\\sqrt{x}\\)" /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathPreview;
