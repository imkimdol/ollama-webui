'use client'

import { useCallback, useEffect, useState } from 'react';
import ollama, { Message, ModelResponse } from 'ollama/browser';

export default function Chat() {
  const [currentModel, setCurrentModel] = useState<string>('llama3.2');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState<Message | null>(null);
  const [prompt, setPrompt] = useState<string>('');
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

  const updateMessages = () => {
    setMessages([...messages]);
  }

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
    const promptMessage = { role: 'user', content: prompt };
    const newMessages = [...messages, promptMessage];
    setMessages(newMessages);
    setPrompt('');

    const responseMessage: Message = { role: 'assistant', content: 'Requesting...'};
    setCurrentResponse(responseMessage);

    try {
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

      newMessages.push(responseMessage);
      newMessages.push({ role: 'assistant', content: 'Request Failed! '});
      setMessages(newMessages);
      setCurrentResponse(null);
    }
  };

  return (
    <div>
      <p>API is {apiIsOnline ? 'online' : 'offline'}</p>
      <button onClick={checkAPI}>Refresh</button>
      
      <h1>Chat</h1>
      {messages.map((m, i) => <ChatMessageComponent key={i} message={m} updateMessages={updateMessages} />)}
      {currentResponse && <ChatMessageComponent message={currentResponse} updateMessages={updateMessages}/>}
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

function ChatMessageComponent({ message, updateMessages }: { message: Message, updateMessages: () => void }) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>(message.content);

  return (
    <div>
      <p>{ message.role === 'assistant' ? 'ASSISTANT: ' : 'USER: '}</p>

      {isEditing ?
      <div>
        <input type="text" value={editText} onChange={e => setEditText(e.target.value)}/>
        <button onClick={() => {setIsEditing(false); message.content = editText; updateMessages();}}>Done</button>
      </div> :
      <div>
        <p>{ message.content }</p>
        <button onClick={() => {setEditText(message.content); setIsEditing(true);}}>Edit</button>
      </div>}
    </div>
  );
};