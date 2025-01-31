'use client'

import { useState, useEffect } from 'react';
import ollama, { ModelResponse } from 'ollama/browser';

export default function Home() {
  const [apiIsOnline, setApiIsOnline] = useState<boolean>(false);
  const [models, setModels] = useState<ModelResponse[]>([]);

  const [model, setCurrentModel] = useState<string>('llama3.2');
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('Prompt response goes here!');

  useEffect(() => {
    checkModels();
    setInterval(() => checkModels(), 10000);
  }, []);


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
      checkModels();
    }
  };

  return (
    <div>
      <p>API is {apiIsOnline ? 'online' : 'offline'}</p>
      {models.map(m => {
        return <p key={m.name}>{m.name}</p>
      })}
      <p>{response}</p>
      <input type="text" value={model} onChange={(e) => setCurrentModel(e.target.value)}/>
      <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={'Prompt goes here'}/>
      <button onClick={() => {onSend()}}>Send Request</button>
    </div>
  );
};