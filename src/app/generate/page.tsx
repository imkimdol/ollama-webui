'use client'

import { useCallback, useEffect, useState } from 'react';
import ollama from 'ollama/browser';
import { ModelResponse } from 'ollama/browser';

export default function Home() {
  const [model, setCurrentModel] = useState<string>('llama3.2');
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('Prompt response goes here!');

  const [apiIsOnline, setApiIsOnline] = useState<boolean>(false);
  const [models, setModels] = useState<ModelResponse[]>([]);

  const checkAPI = useCallback(async () => {
    setApiIsOnline(false);
    setModels([]);
    checkModels();
  }, []);

  useEffect(() => {
    checkAPI();
  }, [checkAPI]);

  const checkModels = async () => {
    try {
      const response = await ollama.list();
      const models = response.models;
      setApiIsOnline(true);
      setModels(models);
    } catch {
      setApiIsOnline(false);
      setModels([]);
    }
  };


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
      <p>API is {apiIsOnline ? 'online' : 'offline'}</p>
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