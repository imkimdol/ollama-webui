import { Message } from 'ollama/browser';
import { createContext } from 'react';

export interface MessageData extends Message {
  current: boolean,
};
export interface ChatData {
  name: string,
  history: MessageData[]
};

export const CurrentChatIDContext = createContext<string | null>(null);
export const SetCurrentChatIDContext = createContext<(currentChatID: string | null)=>void>(()=>{});

export function loadChatDataWithID(id: string): ChatData {
  const item = localStorage.getItem('ollama.chat.' + id);
  if (!item) throw new Error('No such chat exists in storage');
  return JSON.parse(item) as ChatData; 
};
export function saveChatDataWithID(id: string, data: ChatData): void {
  const json = JSON.stringify(data);
  localStorage.setItem('ollama.chat.' + id, json);
};
export function deleteChatDataWithID(id: string) {
  localStorage.removeItem('ollama.chat.' + id);
};