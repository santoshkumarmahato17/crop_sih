export interface AssistantChatRequest {
  message: string;
  farm_id?: string;
  zone_id?: string;
  language?: 'en' | 'ta' | 'hi' | 'mr' | string;
  image_base64?: string;
  image_mime?: string;
}

export interface AssistantChatResponse {
  response_text: string;
  language: string;
  tools_used: string[];
  data_sources: Record<string, any>[];
  disclaimer: string;
}

export interface AssistantToolInfo {
  name: string;
  description: string;
  parameters: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  image_url?: string;
  tools_used?: string[];
  timestamp: string;
  language?: string;
}

