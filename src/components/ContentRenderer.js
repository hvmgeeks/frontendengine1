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

    const inlineMathRegex = /\\\(.*?\\\)/g;
    const blockMathRegex = /\\\[.*?\\\]/gs;
    // const boldTextRegex = /(?:\*\*.*?\*\*)/g;
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

    let newModifiedText = text.replace(blockMathRegex, match => {
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
