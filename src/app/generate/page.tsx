'use client'

import { useState, useContext } from 'react';
import ollama from 'ollama/browser';
import { APIOnlineContext, ModelsContext } from '@/contexts/values';
import { CheckAPIFuncContext } from '@/contexts/functions';

export default function Home() {
  const apiIsOnline = useContext(APIOnlineContext);
  const models = useContext(ModelsContext);
  const checkAPI = useContext(CheckAPIFuncContext);

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
      checkAPI();
    }
  };

  return (
    <div>
      <h1>Generate</h1>   
      <p>{response}</p>
      <select value={model} onChange={(e) => setCurrentModel(e.target.value)}>
        {models.map(m => {
          return <option value={m.name} key={m.name}>{m.name}</option>
        })}
      </select>
      <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={'Prompt goes here'}/>
      <button disabled={!apiIsOnline} onClick={() => {onSend()}}>Send Request</button>
    </div>
  );
};