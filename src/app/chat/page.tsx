'use client'

import { useContext, useEffect, useRef, useState } from 'react';
import ollama, { ModelResponse } from 'ollama/browser';
import Markdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';
import { MessageData, CurrentChatIDContext, loadChatDataWithID, saveChatDataWithID } from '@/misc';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Chat() {
  const lastModelKey = 'ollama_lastModel';
  const router = useRouter();
  const id = useContext(CurrentChatIDContext);

  const stopGeneration = useRef<boolean>(false);
  const pageEndRef = useRef<HTMLDivElement>(null);

  const [currentModel, setCurrentModel] = useState<string>('');
  const [history, setHistory] = useState<MessageData[]>([]);
  const [currentResponse, setCurrentResponse] = useState<MessageData | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [apiIsOnline, setApiIsOnline] = useState<boolean>(false);
  const [models, setModels] = useState<ModelResponse[]>([]);

  useEffect(() => {
    checkAPI();
    loadData();
    
    if (pageEndRef.current) {
      setTimeout(() => {
        pageEndRef.current?.scrollIntoView({ block: 'end' });
      },25);
    }
  }, [id]);

  const checkAPI = async () => {
    setApiIsOnline(false);
    setModels([]);
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
      const newHistory = [...messages, responseMessage];
      saveData(newHistory);
      setHistory(newHistory);

      setCurrentResponse(null);
    } catch {
      checkAPI();

      responseMessage.current = false;
      responseMessage.content += '\nRequest Failed!';
      const newHistory = [...messages, responseMessage];
      saveData(newHistory);
      setHistory(newHistory);

      setCurrentResponse(null);
    }
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
    const scrollRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      if (message.current) scrollRef.current?.scrollIntoView({ block: 'end' });
    });

    function ChatMessageInnerComponent() {
      return (
        <div className='relative m-10'>
          <div className='messagebox p-5 rounded-lg bg-stone-700'>
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
          <div className='absolute hidden group-hover:block' >
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
          <div className='absolute bottom-[-1000px]' ref={scrollRef}></div>
        </div>
        
      );
    };

    if (message.role === 'user') {
      return (
        <div className='group ml-[40vw]'>
          <ChatMessageInnerComponent />
        </div>
      );
    } else if (message.role === 'assistant') {
      return (
        <div className='group mr-[40vw]'>
          <ChatMessageInnerComponent />
        </div>
      );
    }
  };

  return (
    <div className='relative h-screen w-full bg-stone-900'>
      <div className='h-screen overflow-y-scroll'>
        {history.map((m, i) => <ChatMessageComponent key={i} index={i} message={m}/>)}
        {currentResponse && <ChatMessageComponent index={0} message={currentResponse}/>}
        <div className='pb-[5em]'></div>
        <div ref={pageEndRef}></div>
      </div>

      <div className='w-full absolute bottom-0 flex justify-center'>
        <div className='p-3 rounded-md bg-stone-800 flex flex-col gap-4'>
          <div className='flex flex-row items-center justify-center gap-4'>
            <TextareaAutosize className='bg-transparent w-full min-w-[600px] resize-none outline-none' value={prompt} onChange={e => setPrompt(e.target.value)} placeholder='Enter a message...'/>

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
          <div className='flex flex-row justify-between'>
            <select className='max-w-[150px] bg-transparent hover:bg-stone-900' value={currentModel} onChange={e => setCurrentModel(e.target.value)}>
              {models.map(m => {
                return <option className='bg-stone-700' value={m.name} key={m.name}>{m.name}</option>
              })}
            </select>
            <button onClick={checkAPI} className='flex flex-row items-center gap-1'>
              {apiIsOnline ? <div className='h-2 w-2 rounded-[50%] bg-green-400'/> : <div className='h-2 w-2 rounded-[50%] bg-red-400'/>}
              API is {apiIsOnline ? 'online' : 'offline'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};