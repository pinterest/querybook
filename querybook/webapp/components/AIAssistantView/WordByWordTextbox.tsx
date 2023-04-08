import React, {useEffect, useState} from "react";
import './WordByWordTextbox.scss';


export function WordByWordTextbox({ text }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    if (currentWordIndex < text.length) {
      setTimeout(() => {
        const nextWordIndex = text.indexOf(' ', currentWordIndex) + 1;
        const nextWord = text.slice(currentWordIndex, nextWordIndex);
        setDisplayedText(prevText => prevText + nextWord);

        if (nextWordIndex === 0) {
            setDisplayedText(text)
            setCurrentWordIndex(text.length + 1)
        } else {
            setCurrentWordIndex(nextWordIndex);
        }
      }, 100); // Adjust this number to change the speed of word display.
    }
  }, [currentWordIndex, text]);

  return <textarea value={displayedText} readOnly/>;
}