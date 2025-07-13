import React from 'react';
import ContentRenderer from './ContentRenderer';

const MathTest = () => {
  const testFormulas = [
    {
      title: "Basic Math",
      formulas: [
        "\\(x^2\\) - X squared",
        "\\(x_1\\) - X subscript 1", 
        "\\(\\frac{a}{b}\\) - Fraction a over b",
        "\\(\\sqrt{x}\\) - Square root of x",
        "\\(\\sqrt[3]{x}\\) - Cube root of x",
        "\\(x \\pm y\\) - X plus or minus y"
      ]
    },
    {
      title: "Physics Formulas",
      formulas: [
        "\\[E = mc^2\\] - Einstein's equation",
        "\\[F = ma\\] - Newton's second law",
        "\\[v = u + at\\] - Kinematic equation",
        "\\[P = \\frac{W}{t}\\] - Power formula",
        "\\[\\omega = 2\\pi f\\] - Angular frequency"
      ]
    },
    {
      title: "Chemistry Formulas", 
      formulas: [
        "\\(H_2O\\) - Water molecule",
        "\\(CO_2\\) - Carbon dioxide",
        "\\[2H_2 + O_2 \\rightarrow 2H_2O\\] - Chemical reaction",
        "\\[pH = -\\log[H^+]\\] - pH formula",
        "\\(Ca^{2+}\\) - Calcium ion"
      ]
    },
    {
      title: "Advanced Math",
      formulas: [
        "\\[\\int_a^b f(x)dx\\] - Definite integral",
        "\\[\\sum_{i=1}^n x_i\\] - Summation",
        "\\[\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1\\] - Limit",
        "\\[\\frac{d}{dx}(x^n) = nx^{n-1}\\] - Derivative",
        "\\[\\sin^2\\theta + \\cos^2\\theta = 1\\] - Trig identity"
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Mathematical Formula Test Page
      </h1>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Test Status</h2>
        <p className="text-green-700">
          If you can see properly formatted mathematical symbols, squares, fractions, and equations below, 
          then the math rendering is working correctly!
        </p>
      </div>

      <div className="grid gap-8">
        {testFormulas.map((section, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.formulas.map((formula, formulaIndex) => {
                const [math, description] = formula.split(' - ');
                return (
                  <div key={formulaIndex} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <ContentRenderer text={math} />
                    </div>
                    <div className="text-sm text-gray-600 italic">
                      {description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">📝 How to Use</h2>
        <div className="text-blue-700 space-y-2">
          <p><strong>For inline math:</strong> Use \\(your formula\\)</p>
          <p><strong>For block math:</strong> Use \\[your formula\\]</p>
          <p><strong>Examples:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>\\(x^2\\) creates: <ContentRenderer text="\\(x^2\\)" /></li>
            <li>\\(\\frac&#123;a&#125;&#123;b&#125;\\) creates: <ContentRenderer text="\\(\\frac{a}{b}\\)" /></li>
            <li>\\(\\sqrt&#123;x&#125;\\) creates: <ContentRenderer text="\\(\\sqrt{x}\\)" /></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MathTest;
