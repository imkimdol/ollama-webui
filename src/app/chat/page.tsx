'use client'

import { useContext, useEffect, useRef, useState } from 'react';
import ollama, { ModelResponse } from 'ollama/browser';
import Markdown from 'react-markdown';
import { MessageData, CurrentChatIDContext, loadChatDataWithID, saveChatDataWithID } from '@/misc';
import { useRouter } from 'next/navigation';

export default function Chat() {
  const router = useRouter();
  const id = useContext(CurrentChatIDContext);

  const stopGeneration = useRef<boolean>(false);

  const [currentModel, setCurrentModel] = useState<string>('llama3.2');
  const [history, setHistory] = useState<MessageData[]>([]);
  const [currentResponse, setCurrentResponse] = useState<MessageData | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [apiIsOnline, setApiIsOnline] = useState<boolean>(false);
  const [models, setModels] = useState<ModelResponse[]>([]);

  useEffect(() => {
    checkAPI();
    loadData();
  }, [id]);

  const checkAPI = async () => {
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

  const loadData = () => {
    if (!id) return router.push('/');

    const data = loadChatDataWithID(id);
    setHistory(data.history);
  }
  const saveData = (newHistory: MessageData[]) => {
    if (!id) return router.push('/');

    const data = loadChatDataWithID(id);
    data.history = newHistory;
    saveChatDataWithID(id, data);
  }

  const updateHistory = () => {
    setHistory([...history]);
    saveData(history);
  }

  const requestChat = async (messages: MessageData[]) => {
    stopGeneration.current = false;
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
        if (stopGeneration.current) break;
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

    saveData(messages);
  };
  const deleteMessagesUpToIndex = (index: number) => {
    const newHistory = history.slice(0, index)
    setHistory(newHistory);
    saveData(newHistory);
  }

  const onSend = () => {
    const promptMessage = { current: false, role: 'user', content: prompt };
    requestChat([...history, promptMessage]);
    setPrompt('');
  };

  const onRegenerate = () => {
    requestChat(history.slice(0, -1));
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
          <button onClick={() => {setIsEditing(false); message.content = editText; updateHistory();}}>Done</button>
        </div> :
        <div>
          <Markdown>{message.content}</Markdown>
          <button disabled={message.current} onClick={() => {setEditText(message.content); setIsEditing(true);}}>Edit</button>
          <button disabled={message.current} onClick={() => {deleteMessagesUpToIndex(index);}}>Delete</button>
        </div>}
      </div>
    );
  };

  const goBack = () => {
    router.push('/');
  };

  if (!id) return;

  return (
    <div>
      <button onClick={goBack}>Go Back</button>
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
      {currentResponse && <button onClick={() => stopGeneration.current = true}>Stop</button>}
    </div>
  );
};