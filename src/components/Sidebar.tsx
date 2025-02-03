'use client';

import { deleteChatDataWithID, loadChatDataWithID, saveChatDataWithID } from '@/misc';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SidebarProps {
  currentChatID: string | null;
  setCurrentChatID: (id: string | null) => void;
}

export default function Sidebar({ currentChatID, setCurrentChatID }: SidebarProps) {
  const router = useRouter();
  const [ chatIDs, setChatIDs ] = useState<string[]>([]);

  useEffect(() => {
    getChatIDs();
  }, [currentChatID]);

  const getChatIDs = () => {
    const keys = Object.keys(localStorage);
    const newChatIDs = [];

    for (const k of keys) {
      const split = k.split('_');
      if (split.length > 2 && split[0] === 'ollama' && split[1] === 'chat') {
        newChatIDs.push(split[2]);
      }
    }

    setChatIDs(newChatIDs.sort().reverse());
  };

  const newChat = () => {
    const id = new Date().toISOString();
    const data = {
      name: 'Untitled Chat',
      history: []
    }
    saveChatDataWithID(id, data);
    loadChat(id);
  };
  const loadChat = (id: string) => {
    setCurrentChatID(id);
    router.push('/chat');
  };
  const deleteChat = (id: string) => {
    deleteChatDataWithID(id);
    if (currentChatID === id) {
      setCurrentChatID(null);
      router.push('/');
    }
    getChatIDs();
  }

  const ChatButton = ({ id }: { id: string }) => {
    return (
      <div className='relative ml-1 mr-1 group' onClick={()=>loadChat(id)}>
        {currentChatID === id ?
          <div className='bg-stone-700 rounded-md'>
            <ChatButtonInner id={id}/>
          </div>
          :
          <div className='hover:bg-stone-800'>
            <ChatButtonInner id={id}/>
          </div>
        }
      </div>
    );
  };
  const ChatButtonInner = ({ id }: { id: string }) => {
    const data = loadChatDataWithID(id);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [currentName, setNewName] = useState<string>(data.name);
    
    return (
      <div className='p-1 min-w-full rounded-md' onClick={()=>loadChat(id)}>
        {!isEditing && <p className='overflow-x-clip text-nowrap'>{currentName}</p>}
        {isEditing && <input className='bg-transparent outline-none ' type='text' value={currentName} onChange={e => setNewName(e.target.value)} onClick={e => {e.stopPropagation();}}/>}
        <div className='absolute top-0 right-0 h-full flex flex-row justify-center'>
          {isEditing && <button onClick={e => {e.stopPropagation(); data.name=currentName; saveChatDataWithID(id, data); setIsEditing(false);}}>
            <Image
              src="/check.svg"
              alt="Done Icon"
              width={24}
              height={24}
              priority
            />
          </button>}
          {!isEditing && <button className='invisible group-hover:visible' onClick={e => {e.stopPropagation(); setIsEditing(true);}}>
            <Image
              src="/edit.svg"
              alt="Edit Icon"
              width={24}
              height={24}
              priority
            />
          </button>}
          {!isEditing && <button className='invisible group-hover:visible' onClick={e => {e.stopPropagation(); deleteChat(id);}}>
            <Image
              src="/delete.svg"
              alt="Delete Icon"
              width={24}
              height={24}
              priority
            />
          </button>}
        </div>
      </div>
    );
  };

  return (
    <div className='h-screen min-w-52 max-w-52 bg-stone-900 flex flex-col align-center gap-[2px] overflow-y-scroll border-solid border-r-[1px] border-stone-500'>
      <div className='relative m-1 p-1'>
        <p>ollama-webui</p>
        <div className='absolute top-0 right-0 h-full flex flex-row justify-center gap-1'>
          {/* <button>
            <Image
              src="/Settings.svg"
              alt="Settings Icon"
              width={24}
              height={24}
              priority
            />
          </button> */}
          <button onClick={newChat}>
            <Image
              src="/add_comment.svg"
              alt="New Chat Icon"
              width={24}
              height={24}
              priority
            />
          </button>
        </div>
      </div>
      
      {chatIDs.map(id => <ChatButton key={id} id={id}/>)}
    </div>
  );
};

