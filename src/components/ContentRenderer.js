import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// Ensure KaTeX CSS is loaded
const katexCSS = `
.katex {
  font-size: 1.1em !important;
  line-height: 1.2 !important;
}
.katex-display {
  margin: 1em 0 !important;
  text-align: center !important;
}
`;

// Inject CSS if not already present
if (typeof document !== 'undefined' && !document.getElementById('katex-custom-styles')) {
  const style = document.createElement('style');
  style.id = 'katex-custom-styles';
  style.textContent = katexCSS;
  document.head.appendChild(style);
}

const ContentRenderer = ({ text }) => {
    // Handle undefined, null, or empty text
    if (!text || typeof text !== 'string') {
        return <div></div>;
    }

    // Enhanced LaTeX preprocessing for better compatibility
    const preprocessLatex = (content) => {
        // Ensure proper LaTeX delimiters
        let processed = content;

        // Fix common LaTeX delimiter issues
        processed = processed.replace(/\\\(/g, '\\(');
        processed = processed.replace(/\\\)/g, '\\)');
        processed = processed.replace(/\\\[/g, '\\[');
        processed = processed.replace(/\\\]/g, '\\]');

        // Handle escaped backslashes in LaTeX
        processed = processed.replace(/\\\\\(/g, '\\(');
        processed = processed.replace(/\\\\\)/g, '\\)');
        processed = processed.replace(/\\\\\[/g, '\\[');
        processed = processed.replace(/\\\\\]/g, '\\]');

        return processed;
    };

    // Preprocess the text for better LaTeX handling
    const processedText = preprocessLatex(text);

    // Enhanced formatting for AI responses
    const formatAIResponse = (content) => {
        // First remove all ** symbols globally
        const cleanContent = content.replace(/\*\*/g, '');

        // Split into lines for processing
        const lines = cleanContent.split('\n');
        const formattedLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines but preserve spacing
            if (!line) {
                formattedLines.push(<br key={`br-${i}`} />);
                continue;
            }

            // Handle numbered lists (1., 2., etc.)
            if (/^\d+\.\s/.test(line)) {
                const content = line.replace(/^\d+\.\s/, '');
                formattedLines.push(
                    <div key={`numbered-${i}`} style={{
                        margin: '8px 0',
                        paddingLeft: '16px',
                        position: 'relative',
                        lineHeight: '1.6'
                    }}>
                        <span style={{
                            position: 'absolute',
                            left: '0',
                            fontWeight: 'bold',
                            color: '#3b82f6'
                        }}>
                            {line.match(/^\d+/)[0]}.
                        </span>
                        <span>{content}</span>
                    </div>
                );
                continue;
            }

            // Handle bullet points (-, *, •)
            if (/^[-*•]\s/.test(line)) {
                const content = line.replace(/^[-*•]\s/, '');
                formattedLines.push(
                    <div key={`bullet-${i}`} style={{
                        margin: '6px 0',
                        paddingLeft: '16px',
                        position: 'relative',
                        lineHeight: '1.6'
                    }}>
                        <span style={{
                            position: 'absolute',
                            left: '0',
                            color: '#3b82f6',
                            fontWeight: 'bold'
                        }}>
                            •
                        </span>
                        <span>{content}</span>
                    </div>
                );
                continue;
            }

            // Handle headers (##, ###)
            if (/^#{2,3}\s/.test(line)) {
                const level = line.match(/^#+/)[0].length;
                const content = line.replace(/^#+\s/, '');
                formattedLines.push(
                    <div key={`header-${i}`} style={{
                        fontSize: level === 2 ? '18px' : '16px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        margin: '16px 0 8px 0',
                        borderBottom: level === 2 ? '2px solid #e5e7eb' : 'none',
                        paddingBottom: level === 2 ? '4px' : '0'
                    }}>
                        {content}
                    </div>
                );
                continue;
            }

            // Regular text - already cleaned of ** symbols
            formattedLines.push(
                <div key={`text-${i}`} style={{
                    margin: '4px 0',
                    lineHeight: '1.6'
                }}>
                    {line}
                </div>
            );
        }

        return formattedLines;
    };

    const inlineMathRegex = /\\\(.*?\\\)/g;
    const blockMathRegex = /\\\[.*?\\\]/gs;
    const boldTextRegex = /\*\*.*?\*\*/g;
    // console.log('Text: ', text);
    let modifiedText = text.replace(blockMathRegex, match => match.replace(/\n/g, '~~NEWLINE~~'));
    const lines = modifiedText.split('\n');
    // console.log('Lines with symbol: ', lines);
    const restoredLines = lines.map(line => line.replace(/~~NEWLINE~~/g, `\\\\`));
    // console.log('Lines: ', restoredLines);




    const inlineMathSymbol = "~~INLINEMATH~~";
    const blockMathSymbol = "~~BLOCKMATH~~";
    const boldSymbol = "~~BOLD~~";

    let newModifiedText = processedText.replace(blockMathRegex, match => {
        return `~~BLOCKMATH~~${match.replace(/\n/g, '~~NEWLINE~~')}~~BLOCKMATH~~`;
    });

    newModifiedText = newModifiedText.replace(inlineMathRegex, match => {
        return `~~INLINEMATH~~${match}~~INLINEMATH~~`;
    });

    newModifiedText = newModifiedText.replace(boldTextRegex, match => {
        // console.log('Bold Part: ', match);
        return `~~BOLD~~${match.replace(/\*\*/g, '')}~~BOLD~~`;
    });

    const newLines = newModifiedText.split('\n');

    const newRestoredLines = newLines.map(line => line.replace(/~~NEWLINE~~/g, `\\\\`));

    // console.log('New Modified Text: ', newModifiedText);

    const newRegex = /(~~INLINEMATH~~\\?\(.*?\\?\)~~INLINEMATH~~|~~BLOCKMATH~~\\?\[.*?\\?\]~~BLOCKMATH~~|~~BOLD~~.*?~~BOLD~~)/;

    // Debug logging removed to prevent React rendering issues

    // Check if text contains mathematical expressions using processed text
    const hasMath = inlineMathRegex.test(processedText) || blockMathRegex.test(processedText);

    // If no math, use enhanced AI formatting
    if (!hasMath) {
        return (
            <div style={{ fontSize: 'inherit', lineHeight: 'inherit' }}>
                {formatAIResponse(processedText)}
            </div>
        );
    }

    // Original math rendering logic for mathematical content
    return (
        <div>
            {newRestoredLines.map((line, lineIndex) => (
                <div key={lineIndex}>
                    {line.trim() === '' ?
                        <br key={`br-${lineIndex}`} />
                        :
                        line.split(newRegex).map((part, index) => {
                            if (part.startsWith(boldSymbol) && part.endsWith(boldSymbol)) {
                                return (
                                    <React.Fragment key={`${lineIndex}-${index}`}>
                                        {part.replace(/~~BOLD~~/g, '').split(newRegex).map((nestedPart, n_index) => {
                                            if (nestedPart.startsWith(inlineMathSymbol) && nestedPart.endsWith(inlineMathSymbol)) {
                                                return (
                                                    <InlineMath key={`${lineIndex}-${index}-${n_index}`}>
                                                        {nestedPart.replace(/~~INLINEMATH~~/g, '').replace(/^\\\(|\\\)$/g, '')}
                                                    </InlineMath>
                                                );
                                            } else if (nestedPart.startsWith(blockMathSymbol) && nestedPart.endsWith(blockMathSymbol)) {
                                                return (
                                                    <BlockMath key={`${lineIndex}-${index}-${n_index}`}>
                                                        {nestedPart.replace(/~~BLOCKMATH~~/g, '').replace(/\\[\[\]]/g, '')}
                                                    </BlockMath>
                                                );
                                            } else {
                                                return (
                                                    <span key={`${lineIndex}-${index}-${n_index}`} style={{ whiteSpace: 'pre-wrap' }}>
                                                        <strong>{nestedPart}</strong>
                                                    </span>
                                                );
                                            }
                                        })}
                                    </React.Fragment>
                                );
                            } else if (part.startsWith(inlineMathSymbol) && part.endsWith(inlineMathSymbol)) {
                                return (
                                    <InlineMath key={`${lineIndex}-${index}`}>
                                        {part.replace(/~~INLINEMATH~~/g, '').replace(/^\\\(|\\\)$/g, '')}
                                    </InlineMath>
                                );
                            } else if (part.startsWith(blockMathSymbol) && part.endsWith(blockMathSymbol)) {
                                return (
                                    <BlockMath key={`${lineIndex}-${index}`}>
                                        {part.replace(/~~BLOCKMATH~~/g, '').replace(/\\[\[\]]/g, '')}
                                    </BlockMath>
                                );
                            } else {
                                return (
                                    <span key={`${lineIndex}-${index}`} style={{ whiteSpace: 'pre-wrap' }}>
                                        {part}
                                    </span>
                                );
                            }
                        })}
                </div>
            ))}
        </div>

    )
};

export default ContentRenderer;
