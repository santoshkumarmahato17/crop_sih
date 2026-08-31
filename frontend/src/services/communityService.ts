import { apiClient } from './apiClient';
import {
  CommunityPost,
  CommunityPostCreatePayload,
  CommunityCommentCreatePayload,
  CommunityComment,
  CommunityPostListResponse,
} from '@/types';

export const communityService = {
  async listPosts(crop?: string, disease?: string): Promise<CommunityPostListResponse> {
    const params: Record<string, string> = {};
    if (crop) params.crop = crop;
    if (disease) params.disease = disease;
    const response = await apiClient.get<CommunityPostListResponse>('/community/posts', { params });
    return response.data;
  },

  async createPost(payload: CommunityPostCreatePayload): Promise<CommunityPost> {
    const response = await apiClient.post<CommunityPost>('/community/posts', payload);
    return response.data;
  },

  async addComment(postId: string, payload: CommunityCommentCreatePayload): Promise<CommunityComment> {
    const response = await apiClient.post<CommunityComment>(`/community/posts/${postId}/comments`, payload);
    return response.data;
  },

  async likePost(postId: string): Promise<{ post_id: string; likes_count: number }> {
    const response = await apiClient.post<{ post_id: string; likes_count: number }>(
      `/community/posts/${postId}/like`
    );
    return response.data;
  },

  async downvotePost(postId: string): Promise<{ post_id: string; downvotes_count: number }> {
    const response = await apiClient.post<{ post_id: string; downvotes_count: number }>(
      `/community/posts/${postId}/downvote`
    );
    return response.data;
  },

  async sharePost(postId: string): Promise<{ post_id: string; shares_count: number }> {
    const response = await apiClient.post<{ post_id: string; shares_count: number }>(
      `/community/posts/${postId}/share`
    );
    return response.data;
  },
};
