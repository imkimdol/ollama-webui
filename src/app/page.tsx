'use client'

import { useState, useEffect } from 'react';
import ollama, { ModelResponse } from 'ollama/browser';

export default function Home() {
  const [apiIsOnline, setApiIsOnline] = useState<boolean>(false);
  const [models, setModels] = useState<ModelResponse[]>([]);

  const [model, setCurrentModel] = useState<string>('llama3.2');
  const [prompt, setPrompt] = useState<string>('Prompt goes here');
  const [response, setResponse] = useState<string>('Prompt response goes here!');
  useEffect(() => {getModels(setApiIsOnline, setModels)}, []);

  return (
    <div>
      <p>API is {apiIsOnline ? 'online' : 'offline'}</p>
      {models.map(m => {
        return <p key={m.name}>{m.name}</p>
      })}
      <p>{response}</p>
      <input type="text" value={model} onChange={(e) => setCurrentModel(e.target.value)}/>
      <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}/>
      <button onClick={() => {onSend(model, prompt, setResponse)}}>**SEND**</button>
    </div>
  );
};

const getModels = async (setApiIsOnline: (isOnline: boolean) => void, setModels: (models: ModelResponse[]) => void) => {
  try {
    const response = await ollama.list();
    const models = response.models;
    setApiIsOnline(true);
    setModels(models);
  } catch {
    setApiIsOnline(false);
  }
};

const onSend = async (model: string, prompt: string, setResponse: (response: string) => void) => {
  setResponse('Requesting...');
  try {
    const response = await ollama.generate({
      model: model,
      prompt: prompt,
      stream: false
    });
    setResponse(response.response);
  } catch {
    setResponse('Prompt failed');
  }
};