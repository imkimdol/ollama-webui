import { ModelResponse } from "ollama/browser";
import { createContext, } from "react";

export const APIOnlineContext = createContext<boolean>(false);
export const ModelsContext = createContext<ModelResponse[]>([]);