'use client';

import { deleteChatDataWithID, loadChatDataWithID, saveChatDataWithID } from '@/misc';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { v1 as uuid } from 'uuid';

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
      const split = k.split('.');
      if (split.length > 2 && split[0] === 'ollama' && split[1] === 'chat') {
        newChatIDs.push(split[2]);
      }
    }

    setChatIDs(newChatIDs);
  };

  const newChat = () => {
    const id = uuid();
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
    const confirmation = confirm('Do you really want to delete this chat?');
    if (!confirmation) return;

    deleteChatDataWithID(id);
    if (currentChatID === id) {
      setCurrentChatID(null);
      router.push('/');
    }
    getChatIDs();
  }

  const ChatButton = ({ id }: { id: string }) => {
    const data = loadChatDataWithID(id);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [currentName, setNewName] = useState<string>(data.name);
    
    return (
      <div className='m-1 flex flex-row justify-center' onClick={()=>loadChat(id)}>
        {!isEditing && <span>{currentName} </span>}
        {isEditing && <input type='text' value={currentName} onChange={e => setNewName(e.target.value)}/>}
        {isEditing && <button onClick={e => {e.stopPropagation(); data.name=currentName; saveChatDataWithID(id, data); setIsEditing(false);}}>
          <Image
            src="/check.svg"
            alt="Done Icon"
            width={24}
            height={24}
            priority
          />
        </button>}
        {!isEditing && <button onClick={e => {e.stopPropagation(); setIsEditing(true);}}>
          <Image
            src="/edit.svg"
            alt="Edit Icon"
            width={24}
            height={24}
            priority
          />
        </button>}
        <button onClick={e => {e.stopPropagation(); deleteChat(id);}}>
          <Image
            src="/delete.svg"
            alt="Delete Icon"
            width={24}
            height={24}
            priority
          />
        </button>
      </div>

    )
  }

  return (
    <div className='h-screen min-w-52 bg-slate-500 flex flex-col align-center'>
      <p className='m-2 text-center' onClick={()=>router.push('/')}>Home</p>
      <p className='m-2 text-center' onClick={newChat}>New Chat</p>
      {chatIDs.map(id => <ChatButton key={id} id={id}/>)}
    </div>
  );
}

