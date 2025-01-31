'use client'

import { useState, useEffect } from 'react';
import ollama, { Message, ModelResponse } from 'ollama/browser';
import Link from 'next/link';

export default function Chat() {
  const [apiIsOnline, setApiIsOnline] = useState<boolean>(false);
  const [models, setModels] = useState<ModelResponse[]>([]);

  const [currentModel, setCurrentModel] = useState<string>('llama3.2');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState<Message | null>(null);
  const [prompt, setPrompt] = useState<string>('');

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
    try {
      const promptMessage = { role: 'user', content: prompt };
      const newMessages = [...messages, promptMessage];
      setMessages(newMessages);

      const responseMessage: Message = { role: 'assistant', content: 'Requesting...'};
      setCurrentResponse(responseMessage);

      const responseIterator = await ollama.chat({
        model: currentModel,
        messages: newMessages,
        stream: true
      });

      let first = true;
      for await (const partialResponse of responseIterator) {        
        if (first) {
          responseMessage.content = '';
          first = false;
        }

        responseMessage.role = partialResponse.message.role;
        responseMessage.content += partialResponse.message.content;
        setCurrentResponse(prev => ({ ...prev, ...responseMessage }));
      }

      setMessages([...newMessages, responseMessage]);
      setCurrentResponse(null);
    } catch {
      checkModels();
    }
  };

  return (
    <div>
      <p>API is {apiIsOnline ? 'online' : 'offline'}</p>
      
      {messages.map((m, i) => <ChatMessageComponent key={i} message={m}/>)}
      {currentResponse && <ChatMessageComponent message={currentResponse}/>}
      <select value={currentModel} onChange={e => setCurrentModel(e.target.value)}>
        {models.map(m => {
          return <option value={m.name} key={m.name}>{m.name}</option>
        })}
      </select>
      <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={'Prompt goes here'}/>
      <button onClick={() => {onSend()}}>Send Request</button>
      <Link href="/generate">Go to generate</Link>
    </div>
  );
};

function ChatMessageComponent({ message }: { message: Message }) {
  return (
    <div>
      <p>{ message.role === 'assistant' ? 'ASSISTANT: ' : 'USER: '}</p>
      <p>{ message.content }</p>
    </div>
  );
};