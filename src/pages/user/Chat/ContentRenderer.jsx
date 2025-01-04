import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const ContentRenderer = ({ text }) => {
    const inlineMathRegex = /\\\(.*?\\\)/g;
    const blockMathRegex = /\\\[.*?\\\]/gs;
    let modifiedText = text.replace(blockMathRegex, match => match.replace(/\n/g, '~~NEWLINE~~'));
    const lines = modifiedText.split('\n');
    const restoredLines = lines.map(line => line.replace(/~~NEWLINE~~/g, '\\'));
    console.log('Lines: ', restoredLines);

    return (
        <div>
            {restoredLines.map((line, lineIndex) => (
                <div key={lineIndex}>
                    {line.trim() === '' ?
                        <br key={`br-${lineIndex}`} />
                        :
                        line.split(/(\\\(.*?\\\)|\\\[.*?\\\]|(?:\*\*.*?\*\*))/g).map((part, index) => (
                            inlineMathRegex.test(part) ?
                                <InlineMath key={`${lineIndex}-${index}`}>
                                    {part.replace(/^\\\(|\\\)$/g, '')}
                                </InlineMath>
                                : blockMathRegex.test(part) ?
                                    <BlockMath key={`${lineIndex}-${index}`}>
                                        {part.replace(/\\[\[\]]/g, '')}
                                    </BlockMath>
                                    : part.startsWith('**') && part.endsWith('**') ?
                                        <span key={`${lineIndex}-${index}`} style={{ whiteSpace: 'pre-wrap' }}><strong>{part.replace(/\*\*/g, '')}</strong></span>
                                        :
                                        <span key={`${lineIndex}-${index}`} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>

                        ))}
                </div>
            ))}
        </div>
    )
};

export default ContentRenderer;
