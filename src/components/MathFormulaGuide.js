import React, { useState } from 'react';
import ContentRenderer from './ContentRenderer';

const MathFormulaGuide = ({ showGuide, setShowGuide }) => {
  const [activeTab, setActiveTab] = useState('basic');

  const examples = {
    basic: [
      { latex: '\\(x^2\\)', description: 'Superscript (x squared)' },
      { latex: '\\(x_{sub}\\)', description: 'Subscript' },
      { latex: '\\(\\frac{a}{b}\\)', description: 'Fraction' },
      { latex: '\\(\\sqrt{x}\\)', description: 'Square root' },
      { latex: '\\(\\sqrt[3]{x}\\)', description: 'Cube root' },
      { latex: '\\(x \\pm y\\)', description: 'Plus or minus' }
    ],
    physics: [
      { latex: '\\[E = mc^2\\]', description: 'Einstein\'s mass-energy equation' },
      { latex: '\\[F = ma\\]', description: 'Newton\'s second law' },
      { latex: '\\[v = u + at\\]', description: 'Kinematic equation' },
      { latex: '\\[P = \\frac{W}{t}\\]', description: 'Power formula' },
      { latex: '\\[\\omega = 2\\pi f\\]', description: 'Angular frequency' },
      { latex: '\\[V = IR\\]', description: 'Ohm\'s law' }
    ],
    chemistry: [
      { latex: '\\[H_2O\\]', description: 'Water molecule' },
      { latex: '\\[CO_2\\]', description: 'Carbon dioxide' },
      { latex: '\\[CaCl_2 \\rightarrow Ca^{2+} + 2Cl^-\\]', description: 'Ionic dissociation' },
      { latex: '\\[2H_2 + O_2 \\rightarrow 2H_2O\\]', description: 'Chemical reaction' },
      { latex: '\\[pH = -\\log[H^+]\\]', description: 'pH formula' },
      { latex: '\\[PV = nRT\\]', description: 'Ideal gas law' }
    ],
    math: [
      { latex: '\\[\\int_a^b f(x)dx\\]', description: 'Definite integral' },
      { latex: '\\[\\sum_{i=1}^n x_i\\]', description: 'Summation' },
      { latex: '\\[\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1\\]', description: 'Limit' },
      { latex: '\\[\\frac{d}{dx}(x^n) = nx^{n-1}\\]', description: 'Derivative' },
      { latex: '\\[a^2 + b^2 = c^2\\]', description: 'Pythagorean theorem' },
      { latex: '\\[\\sin^2\\theta + \\cos^2\\theta = 1\\]', description: 'Trigonometric identity' }
    ]
  };

  if (!showGuide) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">📐 Mathematical Formula Guide</h2>
            <button
              onClick={() => setShowGuide(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {Object.keys(examples).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid gap-4">
            {examples[activeTab].map((example, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">{example.description}</p>
                    <div className="bg-white p-3 rounded border border-gray-300 mb-2">
                      <ContentRenderer text={example.latex} />
                    </div>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                      {example.latex}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p><strong>Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Use <code>\(...\)</code> for inline math formulas</li>
              <li>Use <code>\[...\]</code> for block (centered) math formulas</li>
              <li>Always preview your formulas before submitting</li>
              <li>Common symbols: ^ (superscript), _ (subscript), \frac{}{} (fraction)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathFormulaGuide;
