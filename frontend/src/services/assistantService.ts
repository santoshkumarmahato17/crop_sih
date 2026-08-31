import { apiClient } from './apiClient';
import {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantToolInfo,
} from '@/types';

export const assistantService = {
  chat: async (request: AssistantChatRequest): Promise<AssistantChatResponse> => {
    const response = await apiClient.post<AssistantChatResponse>(
      '/assistant/chat',
      request
    );
    return response.data;
  },

  listTools: async (): Promise<AssistantToolInfo[]> => {
    const response = await apiClient.get<AssistantToolInfo[]>('/assistant/tools');
    return response.data;
  },
};
