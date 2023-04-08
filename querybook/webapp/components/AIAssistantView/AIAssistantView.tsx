import React, {useEffect, useState} from 'react';

import './AIAssistantView.scss';
import {Button} from 'ui/Button/Button';
import {ThemedCodeHighlightWithMark} from 'ui/CodeHighlight/ThemedCodeHighlightWithMark';
import {AIAssistantResource} from "resource/aiAssistant";
import {WordByWordTextbox} from "./WordByWordTextbox";
import {CopyButton} from "../../ui/CopyButton/CopyButton";


export interface IAIAssistantViewProps {
    userInput?: string;
    viewType: string;
}

export const AIAssistantView: React.FC<IAIAssistantViewProps> = ({
                                                                     userInput,
                                                                     viewType,
                                                                 }) => {

    if (viewType === 'sql2Text') {
        return (<div className="AIAssistantView p16">
            <SQL2TextView query={userInput}></SQL2TextView>
        </div>)
    } else if (viewType === 'text2SQL') {
        return (<div className="AIAssistantView p16">
            <Text2SQLView></Text2SQLView>
        </div>)
    }

}

export const SQL2TextView = ({query}) => {

   const [translation, setTranslation] = useState<string>("");

    async function onSubmitClick() {
        const {data} = await AIAssistantResource.translateSQL2Text(query)
        setTranslation(data)
    }

    const translatedQuery = translation !=="" ? (
        <div>
            <div> {"Hi, i'm QueryBot, your AI assistant. Here's your translated query:"}</div>
            <WordByWordTextbox text={translation}></WordByWordTextbox>
        </div>
    ) : null;
    return (
        <div>
            <ThemedCodeHighlightWithMark
                query={query}
            />
            <div className="flex-right mt16">
                <Button
                    icon="Play"
                    title="Translate Query"
                    onClick={onSubmitClick}
                    className="mr4"
                />
            </div>
            {translatedQuery}

        </div>
    )
}


export const Text2SQLView = () => {

    const [inputText, setInputText] = useState('');
    const handleInputChange = (event) => {
        setInputText(event.target.value);
    };
    useEffect(() => {
            const debounceTimer = setTimeout(() => {
        }, 100);

        return () => {
          clearTimeout(debounceTimer);
        };
      }, [inputText, 100]);

    const [tables, setTables] = useState<string>("")
    const [translation, setTranslation] = useState<string>("");

    async function onFindTablesClick() {
        const {data} = await AIAssistantResource.recommendTableToUse(inputText)
        setTables(data)
    }

    async function onTextToSQLClick() {
        const {data} = await AIAssistantResource.translateText2SQL(inputText, tables)
        setTranslation(data)
    }

    const generatedTables = tables !=="" ? (
        <div>
           <WordByWordTextbox text={tables}></WordByWordTextbox>

            <div className="flex-right mt16">
                <Button
                    icon="Play"
                    title="Generate Queries"
                    onClick={onTextToSQLClick}
                    className="mr4"
                    hidden={tables!==""}
                />
            </div>
        </div>
    ) : null;

    const generatedQueries = (tables !=="" && translation !=="")  ? (
         <div style={{ 'margin': '6px' }}>
             <ThemedCodeHighlightWithMark query={translation}></ThemedCodeHighlightWithMark>
             <div className="flex-right mt16">
                <CopyButton  copyText={translation} title="Copy" />
             </div>
         </div>
    ) : null;

    return (
        <div>
            <div> {"Hi, i'm QueryBot, your AI assistant. What's the analytical problem you're trying to solve?"}</div>
            <input type="text" value={inputText} onChange={handleInputChange} />
            <div className="flex-right mt16">
                <Button
                    icon="Play"
                    title="Find Tables"
                    onClick={onFindTablesClick}
                    className="mr4"
                />
            </div>
            {generatedTables}
            {generatedQueries}
        </div>
    )

}
