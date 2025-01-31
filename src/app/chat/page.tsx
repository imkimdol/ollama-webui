'use client'

import { useContext, useState } from 'react';
import ollama, { Message } from 'ollama/browser';
import { APIOnlineContext, ModelsContext } from '@/contexts/values';
import { CheckAPIFuncContext } from '@/contexts/functions';

export default function Chat() {
  const apiIsOnline = useContext(APIOnlineContext);
  const models = useContext(ModelsContext);
  const checkAPI = useContext(CheckAPIFuncContext);

  const [currentModel, setCurrentModel] = useState<string>('llama3.2');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState<Message | null>(null);
  const [prompt, setPrompt] = useState<string>('');

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
      checkAPI();
    }
  };

  return (
    <div>
      <h1>Chat</h1>
      {messages.map((m, i) => <ChatMessageComponent key={i} message={m}/>)}
      {currentResponse && <ChatMessageComponent message={currentResponse}/>}
      <select value={currentModel} onChange={e => setCurrentModel(e.target.value)}>
        {models.map(m => {
          return <option value={m.name} key={m.name}>{m.name}</option>
        })}
      </select>
      <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={'Prompt goes here'}/>
      <button disabled={!apiIsOnline} onClick={() => {onSend()}}>Send Request</button>
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