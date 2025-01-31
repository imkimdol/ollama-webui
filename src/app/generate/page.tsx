'use client'

import { useState, useContext } from 'react';
import ollama from 'ollama/browser';
import { ModelsContext } from '@/contexts/contexts';

export default function Home() {
  const models = useContext(ModelsContext);

  const [model, setCurrentModel] = useState<string>('llama3.2');
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('Prompt response goes here!');


  const onSend = async () => {
    setResponse('Requesting...');
    try {
      const responseIterator = await ollama.generate({
        model: model,
        prompt: prompt,
        stream: true
      });
  
      let partialText: string = '';
      for await (const partialResponse of responseIterator) {
        partialText += partialResponse.response;
        setResponse(partialText);
      }
    } catch {
      setResponse('Prompt failed');
    }
  };

  return (
    <div>      
      <p>{response}</p>
      <select value={model} onChange={(e) => setCurrentModel(e.target.value)}>
        {models.map(m => {
          return <option value={m.name} key={m.name}>{m.name}</option>
        })}
      </select>
      <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={'Prompt goes here'}/>
      <button onClick={() => {onSend()}}>Send Request</button>
    </div>
  );
};