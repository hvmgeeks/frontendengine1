import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const ContentRenderer = ({ text }) => {
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

    const logger = () => {
        newRestoredLines.map((line, lineIndex) => {
            // console.log(`Line ${lineIndex + 1}: `, line);
            line.split(newRegex).map((part, index) => {
                // console.log(`Line ${lineIndex + 1}, Part ${index + 1}: `, part);
            })
        });
    };

    logger();

    return (
        <div>
            {newRestoredLines.map((line, lineIndex) => (
                <div key={lineIndex}>
                    {line.trim() === '' ?
                        <br key={`br-${lineIndex}`} />
                        :
                        line.split(newRegex).map((part, index) => (
                            part.startsWith(boldSymbol) && part.endsWith(boldSymbol) ?
                                part.replace(/~~BOLD~~/g, '').split(newRegex).map((nestedPart, n_index) => (
                                    nestedPart.startsWith(inlineMathSymbol) && nestedPart.endsWith(inlineMathSymbol) ?
                                        <InlineMath key={`${lineIndex}-${index}-${n_index}`}>
                                            {nestedPart.replace(/~~INLINEMATH~~/g, '').replace(/^\\\(|\\\)$/g, '')}
                                        </InlineMath>
                                        :
                                        nestedPart.startsWith(blockMathSymbol) && nestedPart.endsWith(blockMathSymbol) ?
                                            <BlockMath key={`${lineIndex}-${index}=${n_index}`}>
                                                {nestedPart.replace(/~~BLOCKMATH~~/g, '').replace(/\\[\[\]]/g, '')}
                                            </BlockMath>
                                            :
                                            <span key={`${lineIndex}-${index}-${n_index}`} style={{ whiteSpace: 'pre-wrap' }}><strong>{nestedPart}</strong></span>
                                ))
                                :
                                part.startsWith(inlineMathSymbol) && part.endsWith(inlineMathSymbol) ?
                                    <InlineMath key={`${lineIndex}-${index}`}>
                                        {part.replace(/~~INLINEMATH~~/g, '').replace(/^\\\(|\\\)$/g, '')}
                                    </InlineMath>
                                    : part.startsWith(blockMathSymbol) && part.endsWith(blockMathSymbol) ?
                                        <BlockMath key={`${lineIndex}-${index}`}>
                                            {part.replace(/~~BLOCKMATH~~/g, '').replace(/\\[\[\]]/g, '')}
                                        </BlockMath>
                                        :
                                        <span key={`${lineIndex}-${index}`} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>

                        ))}
                </div>
            ))}
        </div>

    )
};

export default ContentRenderer;
