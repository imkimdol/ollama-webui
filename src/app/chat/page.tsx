'use client'

import { useCallback, useEffect, useState } from 'react';
import ollama, { Message, ModelResponse } from 'ollama/browser';

interface MessageData extends Message {
  current: boolean,
}

export default function Chat() {
  const [currentModel, setCurrentModel] = useState<string>('llama3.2');
  const [history, setHistory] = useState<MessageData[]>([]);
  const [currentResponse, setCurrentResponse] = useState<MessageData | null>(null);
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
    setHistory([...history]);
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

  const requestChat = async (messages: MessageData[]) => {
    setHistory(messages);

    const responseMessage: MessageData = { current: true, role: 'assistant', content: 'Requesting...'};
    setCurrentResponse(responseMessage);

    try {
      const responseIterator = await ollama.chat({
        model: currentModel,
        messages: messages,
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

      responseMessage.current = false;
      setHistory([...messages, responseMessage]);
      setCurrentResponse(null);
    } catch {
      checkAPI();

      responseMessage.current = false;
      messages.push(responseMessage);
      messages.push({ current: false, role: 'assistant', content: 'Request Failed! '});
      setHistory(messages);
      setCurrentResponse(null);
    }
  };

  const onSend = () => {
    const promptMessage = { current: false, role: 'user', content: prompt };
    requestChat([...history, promptMessage]);
    setPrompt('');
  };

  const onRegenerate = () => {
    requestChat(history.slice(0, -1));
  }

  const deleteMessagesUpToIndex = (index: number) => {
    setHistory(history.slice(0, index));
  }

  function ChatMessageComponent({ index, message }: { index: number, message: MessageData}) {
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
          <button disabled={message.current} onClick={() => {setEditText(message.content); setIsEditing(true);}}>Edit</button>
          <button disabled={message.current} onClick={() => {deleteMessagesUpToIndex(index);}}>Delete</button>
        </div>}
      </div>
    );
  };

  return (
    <div>
      <p>API is {apiIsOnline ? 'online' : 'offline'}</p>
      <button onClick={checkAPI}>Refresh</button>
      
      <h1>Chat</h1>
      {history.map((m, i) => <ChatMessageComponent key={i} index={i} message={m}/>)}
      {currentResponse && <ChatMessageComponent index={0} message={currentResponse}/>}
      <button disabled={!apiIsOnline || currentResponse != null || history.length == 0 || history[history.length-1].role != 'assistant'} onClick={onRegenerate}>Regenerate</button>
      <select value={currentModel} onChange={e => setCurrentModel(e.target.value)}>
        {models.map(m => {
          return <option value={m.name} key={m.name}>{m.name}</option>
        })}
      </select>
      <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={'Prompt goes here'}/>
      <button disabled={!apiIsOnline || currentResponse != null} onClick={onSend}>Send Request</button>
    </div>
  );
};