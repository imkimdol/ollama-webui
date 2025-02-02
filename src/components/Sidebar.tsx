'use client';

import { deleteChatDataWithID, loadChatDataWithID, saveChatDataWithID } from "@/misc";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
      <div>
        {!isEditing && <span>{currentName} </span>}
        {isEditing && <input type="text" value={currentName} onChange={e => setNewName(e.target.value)}/>}
        {isEditing && <button onClick={()=>{data.name=currentName; saveChatDataWithID(id, data); setIsEditing(false);}}>Done</button>}
        {!isEditing && <button onClick={()=>setIsEditing(true)}>Rename</button>}
        <button onClick={()=>deleteChat(id)}>Delete</button>
        <button disabled={currentChatID === id} onClick={()=>loadChat(id)}>View</button>
      </div>

    )
  }

  return (
    <div>
      <button disabled={currentChatID===null} onClick={()=>router.push('/')}>Home</button>
      <br/>
      <button onClick={newChat}>New Chat</button>
      {chatIDs.map(id => <ChatButton key={id} id={id}/>)}
    </div>
  );
}

