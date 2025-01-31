'use client'

import { useState, useEffect } from "react";

interface APIModelResponse {
  "name": string,
  "modified_at": string,
  "size": number,
  "digest": string,
  "details": {
    "format": string,
    "family": string,
    "families": string | null,
    "parameter_size": string,
    "quantization_level": string
  }
}
interface APIChatFinalResponse {
  "model": string,
  "created_at": string,
  "response": string,
  "done": boolean,
  "context": number[],
  "total_duration": number,
  "load_duration": number,
  "prompt_eval_count": number,
  "prompt_eval_duration": number,
  "eval_count": number,
  "eval_duration": number
}

export default function Home() {
  const [apiIsOnline, setApiIsOnline] = useState<boolean>(false);
  const [models, setModels] = useState<APIModelResponse[]>([]);

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

const getModels = async (setApiIsOnline: (isOnline: boolean) => void, setModels: (models: APIModelResponse[]) => void) => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    const json = await response.json();
    const models = json.models as APIModelResponse[];
    setApiIsOnline(true);
    setModels(models);
  } catch {
    setApiIsOnline(false);
  }
};

const onSend = async (model: string, prompt: string, setResponse: (response: string) => void) => {
  setResponse('Requesting...');
  try {
    const response = await fetch('http://localhost:11434/api/generate',
      {
        method: 'POST',
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false
        })
      }
    );
    const chat = await response.json() as APIChatFinalResponse;
    setResponse(chat.response);
  } catch {
    setResponse('Prompt failed');
  }
};