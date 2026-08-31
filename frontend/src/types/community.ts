export interface CommunityComment {
  id: string;
  post_id: string;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
  likes_count: number;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  crop_type: string;
  disease_tag: string;
  image_url?: string;
  author_name: string;
  author_role: string;
  author_location: string;
  created_at: string;
  likes_count: number;
  downvotes_count?: number;
  shares_count: number;
  comments_count: number;
  translation?: string;
  comments: CommunityComment[];
}

export interface CommunityPostCreatePayload {
  title: string;
  content: string;
  crop_type: string;
  disease_tag: string;
  image_url?: string;
  author_name: string;
  author_role: string;
  author_location: string;
}

export interface CommunityCommentCreatePayload {
  author_name: string;
  author_role: string;
  content: string;
}

export interface CommunityPostListResponse {
  total: number;
  posts: CommunityPost[];
}
