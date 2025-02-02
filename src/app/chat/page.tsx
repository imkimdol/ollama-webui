'use client'

import { useContext, useEffect, useRef, useState } from 'react';
import ollama, { ModelResponse } from 'ollama/browser';
import Markdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';
import { MessageData, CurrentChatIDContext, loadChatDataWithID, saveChatDataWithID } from '@/misc';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Chat() {
  const lastModelKey = 'ollama.lastModel';
  const router = useRouter();
  const id = useContext(CurrentChatIDContext);

  const stopGeneration = useRef<boolean>(false);

  const [currentModel, setCurrentModel] = useState<string>('');
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
    checkLastUsedModel();
  };

  const checkLastUsedModel = () => {
    const model = localStorage.getItem(lastModelKey);
    if (model) setCurrentModel(model);    
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
      localStorage.setItem(lastModelKey, currentModel);

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
  
    function ChatMessageInnerComponent() {
      return (
        <div className='relative m-10'>
          <div className='messagebox p-5 rounded-md bg-stone-700'>
            <p>{ message.role === 'assistant' ? 'Assistant' : 'User'}</p>
            {isEditing ?
              <div>
                <TextareaAutosize className='w-full bg-stone-800 resize-none' value={editText} onChange={e => setEditText(e.target.value)}/>
                <button onClick={() => {setIsEditing(false); message.content = editText; updateHistory();}}>
                  <Image
                    src="/check.svg"
                    alt="Done Icon"
                    width={24}
                    height={24}
                    priority
                  />
                </button>
              </div>

            :
              <Markdown>{message.content}</Markdown>
            }
          </div>
          <div className='absolute hidden group-hover:block'>
            {!isEditing &&
              <div>
                {!currentResponse &&
                  <button onClick={() => {setEditText(message.content); setIsEditing(true);}}>
                    <Image
                      src="/edit.svg"
                      alt="Edit Icon"
                      width={24}
                      height={24}
                      priority
                    />
                  </button>
                }
                {!currentResponse &&
                  <button onClick={() => {deleteMessagesUpToIndex(index);}}>
                    <Image
                      src="/delete.svg"
                      alt="Delete Icon"
                      width={24}
                      height={24}
                      priority
                    />
                  </button>
                }
              </div>
            }
          </div>
        </div>
        
      );
    };

    if (message.role === 'user') {
      return (
        <div className='group ml-[40vw]'>
          <ChatMessageInnerComponent />
        </div>
      );
    } else {
      return (
        <div className='group mr-[40vw]'>
          <ChatMessageInnerComponent />
        </div>
      );
    }

  };

  return (
    <div className='relative h-screen w-full bg-slate-900'>
      <div className='h-screen overflow-y-scroll pb-[50px]'>
        {history.map((m, i) => <ChatMessageComponent key={i} index={i} message={m}/>)}
        {currentResponse && <ChatMessageComponent index={0} message={currentResponse}/>}
      </div>
      <p className='absolute bottom-0 right-0' onClick={checkAPI}>API is {apiIsOnline ? 'online' : 'offline'}</p>

      <div className='w-full absolute bottom-0 flex justify-center'>
        <div className='p-3 rounded-md bg-stone-900 flex flex-row align-center justify-center gap-4'>
          <select className='min-w-[150px] bg-stone-950' value={currentModel} onChange={e => setCurrentModel(e.target.value)}>
            {models.map(m => {
              return <option value={m.name} key={m.name}>{m.name}</option>
            })}
          </select>
          <TextareaAutosize className='bg-stone-950 w-full min-w-[50vw] resize-none' value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={'Prompt goes here'}/>

          {!currentResponse && history.length > 0 && history[history.length-1].role === 'assistant' &&
            <button disabled={!apiIsOnline} onClick={onRegenerate}>
              <Image
                src="/refresh.svg"
                alt="Regenerate Icon"
                width={24}
                height={24}
                priority
              />
            </button>
          }
          {!currentResponse &&
            <button disabled={!apiIsOnline} onClick={onSend}>
              <Image
                src="/send.svg"
                alt="Send Icon"
                width={24}
                height={24}
                priority
              />
            </button>
          }
          {currentResponse && 
            <button onClick={() => stopGeneration.current = true}>
              <Image
                src="/stop.svg"
                alt="Stop Icon"
                width={24}
                height={24}
                priority
              />
            </button>
          }
        </div>
      </div>
    </div>
  );
};