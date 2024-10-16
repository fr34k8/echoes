import { z } from "zod";
//import { MessageType } from "langchain/schema";

export type ChatRole = "user" | "assistant" | "system" | "function";
// Basically ChatEntry is equivalent to Message from 'vercel-ai-sdk
export type ChatEntry = {
  id: string;
  role: ChatRole;
  content: string;
  name?: string | undefined;
  audio?: string;
  subRole?: string;
};

export type ChatLog = {
  log: Array<ChatEntry>;
  tldraw_snapshot?: Array<ChatEntry>;
};
export type SnapShot = {
  tldraw_snapshot: Array<ChatEntry>;
};

export const chattype = z.enum([
  "chat",
  "tldraw",
  "rag",
  "ella",
  "advanced",
  "storm",
]);
export type ChatType = z.infer<typeof chattype>;
export interface PostBody {
  user_id: string;
  messages: ChatEntry[];
}

export type SystemPersona =
  | "scientist"
  | "regulator"
  | "student"
  | "IPR"
  | null;

export const QuerySchema = z.object({
  query: z.string().nonempty(),
  systemMessage: z.string(),
});

export const CHAT_COMPLETION_CONTENT =
  "This chat has reached its maximum limit. Start a new Conversation.";

export type Model =
  | "gpt-4"
  | "gpt-4-turbo"
  | "gpt-3.5-turbo"
  | "gpt-3.5-turbo-16k"
  | "gpt-4-1106-preview";

export type PromptTypes =
  | "factCheck"
  | "explain"
  | "elaborate"
  | "criticise"
  | "examples"
  | "references";

export type MessageRole = "function" | "user" | "assistant" | "system";

// export type MessageRole = Pick<Message, "role">

export type AIType = "universal" | "oligoai" | "agent";

export enum Type {
  Patent = "patent",
}

export interface Result {
  // Result from patent api (generated through rest client)
  id: string;
  type: Type;
  publication_id: string;
  title: string;
  abstract: string;
  publication_date: Date;
  www_link: string;
  owner: string;
  image: string;
  alias: string;
  inventors: string[];
  score: number;
  snippet: null;
  mapping: null;
  index: string;
}

export const addToDatasourceSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.string(), // later it will mime/type of allowed files
  url: z.string(),
});

export type AddToDatasourceSchema = z.infer<typeof addToDatasourceSchema>;
