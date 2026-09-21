import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Share2,
  PenLine,
  X,
  Languages,
  CheckCircle2,
  Send,
  Camera,
  Sparkles,
  Users,
} from 'lucide-react';
import { communityService } from '@/services/communityService';
import { CommunityPost } from '@/types';

export const FarmerCommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('Popular');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);
  const [translatedPosts, setTranslatedPosts] = useState<Record<string, boolean>>({});
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({
    'post-ban-02': true,
    'post-101': true,
  });

  // Reply Drafts & Toasts
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [shareToast, setShareToast] = useState<string | null>(null);

  // New Post Form State & Submitting Flag
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newCrop, setNewCrop] = useState<string>('Wheat');
  const [newDiseaseTag, setNewDiseaseTag] = useState<string>('Leaf Spot & Pests');
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('Sandeep');
  const [authorLocation, setAuthorLocation] = useState<string>('India');

  const filterCrops = [
    { id: 'Popular', label: 'Popular', icon: '🔥', count: '1.2k' },
    { id: 'Broad Bean', label: 'Broad Bean', icon: '🫘', count: '340' },
    { id: 'Banana', label: 'Banana', icon: '🍌', count: '890' },
    { id: 'Wheat', label: 'Wheat', icon: '🌾', count: '1.5k' },
    { id: 'Rice', label: 'Rice', icon: '🍚', count: '2.1k' },
    { id: 'Corn', label: 'Corn', icon: '🌽', count: '940' },
    { id: 'Tomato', label: 'Tomato', icon: '🍅', count: '760' },
  ];

  const diseaseCategories = [
    { id: 'All', label: 'All Issues', count: '150+' },
    { id: 'Fungal', label: 'Fungal Diseases', count: '64' },
    { id: 'Pest', label: 'Pest & Insects', count: '48' },
    { id: 'Nutrient', label: 'Nutrient Deficiency', count: '22' },
    { id: 'Water', label: 'Water & Heat Stress', count: '18' },
  ];

  const expertAgronomists = [
    { name: 'Dr. Meenakshi Sundaram', role: 'Chief Extension Agronomist', answers: 142, rating: '4.9 ⭐', avatarBg: 'from-emerald-600 to-teal-500' },
    { name: 'Dr. R. K. Verma', role: 'Plant Pathologist', answers: 98, rating: '4.8 ⭐', avatarBg: 'from-blue-600 to-indigo-500' },
    { name: 'Officer S. Kumar', role: 'Field Surveillance Inspector', answers: 115, rating: '4.9 ⭐', avatarBg: 'from-purple-600 to-violet-500' },
  ];

  useEffect(() => {
    loadPosts();
  }, [selectedCrop]);

  const loadPosts = async () => {
    try {
      const res = await communityService.listPosts(
        selectedCrop === 'Popular' ? undefined : selectedCrop
      );
      if (res && res.posts && res.posts.length > 0) {
        setPosts(res.posts);
      }
    } catch (err) {
      console.warn('Backend listPosts offline or unavailable, keeping existing posts feed', err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleTrim = newTitle.trim();
    const contentTrim = newContent.trim();
    if (!titleTrim || !contentTrim) return;

    setIsSubmitting(true);
    const postPayload = {
      title: titleTrim,
      content: contentTrim,
      crop_type: newCrop,
      disease_tag: newDiseaseTag.trim() || `${newCrop} Health Observation`,
      image_url: newImageUrl.trim() || undefined,
      author_name: authorName.trim() || 'Farmer Sandeep',
      author_role: 'Farmer',
      author_location: authorLocation.trim() || 'India',
    };

    let createdPost: CommunityPost;
    try {
      createdPost = await communityService.createPost(postPayload);
    } catch (err) {
      console.warn('Backend API createPost failed, creating post locally:', err);
      createdPost = {
        id: `post-${Date.now()}`,
        ...postPayload,
        created_at: new Date().toISOString(),
        likes_count: 1,
        downvotes_count: 0,
        shares_count: 0,
        comments_count: 0,
        comments: [],
      };
    }

    // Prepend to posts state
    setPosts((prev) => [createdPost, ...prev]);

    // Reset form state & close modal
    setIsComposerOpen(false);
    setIsSubmitting(false);
    setNewTitle('');
    setNewContent('');
    setNewImageUrl('');

    // Switch selected crop if needed so post is immediately visible
    if (selectedCrop !== 'Popular' && selectedCrop !== newCrop) {
      setSelectedCrop('Popular');
    }

    // Show confirmation toast
    setShareToast('✅ Your question has been published to the Community!');
    setTimeout(() => setShareToast(null), 4000);
  };

  const handleUpvote = async (postId: string) => {
    try {
      await communityService.likePost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p))
      );
    } catch (err) {
      console.error('Failed to upvote post', err);
    }
  };

  const handleDownvote = async (postId: string) => {
    try {
      await communityService.downvotePost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, downvotes_count: (p.downvotes_count || 0) + 1 }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to downvote post', err);
    }
  };

  const handleShare = async (post: CommunityPost) => {
    try {
      await communityService.sharePost(post.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, shares_count: p.shares_count + 1 } : p))
      );
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`${window.location.origin}/community#${post.id}`);
      }
      setShareToast(`Link to discussion copied to clipboard!`);
      setTimeout(() => setShareToast(null), 3000);
    } catch (err) {
      console.error('Failed to share post', err);
    }
  };

  const toggleTranslate = (postId: string) => {
    setTranslatedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleAnswers = (postId: string) => {
    setExpandedAnswers((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAddAnswer = async (postId: string) => {
    const text = replyDrafts[postId];
    if (!text || !text.trim()) return;

    try {
      const newComment = await communityService.addComment(postId, {
        author_name: 'Dr. Meenakshi Sundaram',
        author_role: 'Extension Agronomist',
        content: text.trim(),
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments_count: p.comments_count + 1,
                comments: [...p.comments, newComment],
              }
            : p
        )
      );
      setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Failed to add answer', err);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.crop_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      p.disease_tag.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      p.title.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-24 transition-colors duration-200">
      {/* 1. Full-Width Vibrant Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl border border-agri-500/25 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-accent-lime text-slate-950 font-black text-xs tracking-wider uppercase font-mono shadow-md">
              COMMUNITY FORUM
            </span>
            <span className="text-xs text-agri-300 font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> 52,000+ Active Farmers & Agronomists
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Agricultural Knowledge & Disease Solutions Exchange
          </h1>
          <p className="text-xs sm:text-sm text-agri-300 max-w-2xl leading-relaxed">
            Ask symptoms, share leaf photo diagnostics in Hindi, Tamil, or English, and get instant verified solutions from certified regional agronomists.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="px-5 py-3 rounded-2xl bg-accent-lime hover:bg-accent-limeHover text-slate-950 font-extrabold text-xs transition flex items-center gap-2 shadow-lg shadow-accent-lime/15 active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Ask Community / Post Photo</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/analysis')}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent-lime" />
            <span>AI Scanner</span>
          </button>
        </div>

        {/* Decorative background glow circle */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-agri-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="p-3.5 rounded-2xl bg-blue-600 text-white text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xl sticky top-20 z-40">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* 2. Responsive 12-Column Full Screen Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN (3 Cols): Crop Explorer & Problem Category Filters            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 space-y-5">
          {/* Crop Filter Selector */}
          <div className="p-5 rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50/90 dark:border-slate-800/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-agri-100 dark:border-agri-700/25 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-agri-700 dark:text-agri-300">
                Filter by Crop
              </span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold cursor-pointer" onClick={() => setSelectedCrop('Popular')}>
                Reset
              </span>
            </div>

            <div className="space-y-1">
              {filterCrops.map((crop) => {
                const isSelected = selectedCrop === crop.id;
                return (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => setSelectedCrop(crop.id)}
                    className={`w-full p-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-agri-900 dark:bg-white text-white dark:text-agri-900 shadow-sm'
                        : 'hover:bg-agri-50 dark:hover:bg-agri-800/60 text-agri-700 dark:text-agri-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{crop.icon}</span>
                      <span>{crop.label}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-agri-900'
                          : 'bg-agri-50 dark:bg-agri-800/50 text-agri-500/70 dark:text-agri-400/70'
                      }`}
                    >
                      {crop.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disease Category Filter */}
          <div className="p-5 rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50/90 dark:border-slate-800/90 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-700 dark:text-agri-300 block border-b border-agri-100 dark:border-agri-700/25 pb-2.5">
              Issue Category
            </span>
            <div className="space-y-1">
              {diseaseCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full p-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-agri-500 text-white shadow-sm'
                        : 'hover:bg-agri-50 dark:hover:bg-agri-800/60 text-agri-700 dark:text-agri-300'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-[10px] opacity-75 font-mono">{cat.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top Verified Extension Agronomists */}
          <div className="p-5 rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50/90 dark:border-slate-800/90 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-700 dark:text-agri-300 block border-b border-agri-100 dark:border-agri-700/25 pb-2.5">
              Verified Plant Advisors
            </span>
            <div className="space-y-3 text-xs">
              {expertAgronomists.map((exp, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${exp.avatarBg} text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-md`}>
                    {exp.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-agri-900 dark:text-white truncate">{exp.name}</p>
                    <p className="text-[10px] text-agri-500/70 dark:text-agri-400/70 truncate">{exp.role}</p>
                  </div>
                  <span className="text-[10px] text-agri-600 dark:text-agri-400 font-mono font-bold">{exp.rating}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN FEED COLUMN (9 Cols): Search, Filter & Community Questions Feed      */}
        {/* ========================================================================= */}
        <div className="lg:col-span-9 space-y-5">
          {/* Top Plantix-Style Search Bar & Pill Filter Row */}
          <div className="p-4 rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50/90 dark:border-slate-800/90 shadow-sm space-y-3">
            {/* Search Input */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-agri-400/70 absolute left-4 top-3" />
                <input
                  type="text"
                  placeholder="Search in Community (symptoms, pests, crops)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-agri-50 dark:bg-agri-800/50 border border-agri-200/50 dark:border-slate-700/80 rounded-full pl-11 pr-4 py-2.5 text-xs sm:text-sm text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-blue-500 font-medium transition"
                />
              </div>

              <button
                type="button"
                onClick={() => navigate('/alerts')}
                className="p-2.5 rounded-full hover:bg-agri-50 dark:hover:bg-agri-800/60 text-agri-600 dark:text-agri-300 transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>

              <button
                type="button"
                className="p-2.5 rounded-full hover:bg-agri-50 dark:hover:bg-agri-800/60 text-agri-600 dark:text-agri-300 transition"
                title="More"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Filter by Horizontal Pills */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-agri-900 dark:text-white">Filter by</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => setSelectedCrop('Popular')}>
                Change
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              {filterCrops.map((crop) => {
                const isSelected = selectedCrop === crop.id;
                return (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => setSelectedCrop(crop.id)}
                    className={`px-4 py-2 rounded-full font-bold transition flex items-center gap-1.5 flex-shrink-0 border ${
                      isSelected
                        ? 'bg-agri-900 dark:bg-white text-white dark:text-agri-900 border-slate-900 dark:border-white shadow-sm'
                        : 'bg-white dark:bg-surface-darkCard border-agri-200/50 dark:border-agri-700/30 text-agri-800 dark:text-agri-200 hover:border-slate-400'
                    }`}
                  >
                    <span>{crop.icon}</span>
                    <span>{crop.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick "Ask Question / Share Leaf Photo" Action Bar */}
          <div
            onClick={() => setIsComposerOpen(true)}
            className="p-4 rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 shadow-sm flex items-center gap-3 cursor-pointer hover:border-blue-500 transition group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center flex-shrink-0">
              <PenLine className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-agri-500/70 dark:text-agri-400/70 font-medium group-hover:text-agri-700 dark:group-hover:text-agri-200 transition">
                Have a crop problem? Post symptoms, upload photo & ask community...
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm"
            >
              + Post
            </button>
          </div>

          {/* Community Post Cards Stream */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 space-y-3 shadow-sm">
                <p className="text-sm font-bold text-agri-700 dark:text-agri-300">
                  No questions found for {selectedCrop}.
                </p>
                <p className="text-xs text-agri-500/70 dark:text-agri-400/70">
                  Be the first to ask about your crop problems!
                </p>
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(true)}
                  className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold"
                >
                  + Ask Community
                </button>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const isTranslated = translatedPosts[post.id];
                const areAnswersOpen = expandedAnswers[post.id];

                return (
                  <div
                    key={post.id}
                    id={post.id}
                    className="rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50/90 dark:border-slate-800/90 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
                  >
                    {/* Optional Crop Leaf Image on Top */}
                    {post.image_url && (
                      <div className="w-full h-64 bg-slate-950 overflow-hidden relative group">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                        />
                        <span className="absolute bottom-2.5 left-3 px-3 py-1 rounded-full bg-slate-950/75 backdrop-blur-sm text-white text-[11px] font-mono font-bold">
                          {post.crop_type} Photo Scan
                        </span>
                      </div>
                    )}

                    <div className="p-5 space-y-3.5">
                      {/* Top Author Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-200 dark:border-blue-700/50 flex-shrink-0">
                          {post.author_name.charAt(0)}
                        </div>
                        <div className="leading-tight">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                              {post.author_name}
                            </span>
                            <span className="text-[11px] text-agri-500/70 dark:text-agri-400/70 font-medium">
                              • {post.author_location || 'India'}
                            </span>
                          </div>
                          <p className="text-[11px] text-agri-500/70 dark:text-agri-400/70 pt-0.5 font-medium">
                            {post.created_at} • {post.crop_type === 'Banana' ? '🍌' : post.crop_type === 'Wheat' ? '🌾' : post.crop_type === 'Rice' ? '🍚' : post.crop_type === 'Broad Bean' ? '🫘' : '🌱'} {post.crop_type}
                          </p>
                        </div>
                      </div>

                      {/* Post Title & Content */}
                      <div className="space-y-1.5">
                        <h3 className="font-bold text-agri-900 dark:text-white text-base leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-agri-700 dark:text-agri-300 leading-relaxed font-normal">
                          {isTranslated && post.translation ? post.translation : post.content}
                        </p>
                      </div>

                      {/* Translate Button & Answers Count Link */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          type="button"
                          onClick={() => toggleTranslate(post.id)}
                          className="text-agri-600 dark:text-agri-400/70 hover:text-blue-600 dark:hover:text-blue-400 font-semibold flex items-center gap-1.5 transition"
                        >
                          <Languages className="w-3.5 h-3.5" />
                          <span>{isTranslated ? 'Show Original' : 'Translate'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleAnswers(post.id)}
                          className="text-agri-500/70 dark:text-agri-400/70 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition"
                        >
                          {post.comments_count} answers
                        </button>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-agri-100 dark:border-agri-700/25 text-xs">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleUpvote(post.id)}
                            className="flex items-center gap-1.5 text-agri-700 dark:text-agri-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{post.likes_count}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownvote(post.id)}
                            className="flex items-center gap-1.5 text-agri-700 dark:text-agri-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold transition"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span>{post.downvotes_count || 0}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleShare(post)}
                          className="text-agri-600 dark:text-agri-400/70 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          title="Share Discussion"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Expandable Answers Thread */}
                      {areAnswersOpen && (
                        <div className="pt-3 space-y-3 border-t border-agri-100 dark:border-agri-700/25">
                          <span className="text-[11px] font-bold text-agri-500/70 uppercase tracking-wider block">
                            Community & Expert Answers ({post.comments.length})
                          </span>

                          <div className="space-y-2">
                            {post.comments.map((comm) => (
                              <div
                                key={comm.id}
                                className="p-3.5 rounded-2xl bg-surface-light dark:bg-agri-800/30 border border-agri-200/50/80 dark:border-slate-700/80 space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                      {comm.author_name}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-agri-800 dark:text-agri-300 text-[9px] font-bold">
                                      {comm.author_role}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-agri-400/70 font-mono">{comm.created_at}</span>
                                </div>
                                <p className="text-agri-700 dark:text-agri-200 leading-relaxed">
                                  {comm.content}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Add Answer Input */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="Write an answer / remedy..."
                              value={replyDrafts[post.id] || ''}
                              onChange={(e) =>
                                setReplyDrafts({ ...replyDrafts, [post.id]: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddAnswer(post.id);
                              }}
                              className="flex-1 bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-full px-4 py-2 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddAnswer(post.id)}
                              className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
                              title="Submit Answer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. Create Question Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 bg-agri-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-agri-200/50 dark:border-agri-700/25 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-base text-agri-900 dark:text-white flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Ask Community / Share Problem</span>
                </h3>
                <p className="text-xs text-agri-500/70 dark:text-agri-400/70">
                  Ask fellow farmers and agricultural experts for pest & disease advice.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="p-2 rounded-xl hover:bg-agri-50 dark:hover:bg-agri-800/60 text-agri-400/70 hover:text-agri-600 dark:hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3.5 py-2 text-xs text-agri-900 dark:text-agri-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    value={authorLocation}
                    onChange={(e) => setAuthorLocation(e.target.value)}
                    className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3.5 py-2 text-xs text-agri-900 dark:text-agri-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                    Crop *
                  </label>
                  <select
                    value={newCrop}
                    onChange={(e) => setNewCrop(e.target.value)}
                    className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3 py-2 text-xs text-agri-900 dark:text-agri-100 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="Banana">🍌 Banana</option>
                    <option value="Broad Bean">🫘 Broad Bean</option>
                    <option value="Wheat">🌾 Wheat</option>
                    <option value="Rice">🍚 Rice / Paddy</option>
                    <option value="Corn">🌽 Corn / Maize</option>
                    <option value="Tomato">🍅 Tomato</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                  Suspected Issue / Tag (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leaf Spot, Panama Wilt, Rust Pustules"
                  value={newDiseaseTag}
                  onChange={(e) => setNewDiseaseTag(e.target.value)}
                  className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3.5 py-2 text-xs text-agri-900 dark:text-agri-100 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                  Question Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yellow leaf spots with wilting on banana foliage..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3.5 py-2 text-xs text-agri-900 dark:text-agri-100 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                  Description & Symptoms *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what you see on the leaves, stems or fruit..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3.5 py-2 text-xs text-agri-900 dark:text-agri-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3.5 py-2 text-xs text-agri-900 dark:text-agri-100 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-agri-200/50 dark:border-agri-700/25">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 rounded-full bg-agri-50 hover:bg-agri-100 dark:bg-agri-800/50 dark:hover:bg-agri-700/40 text-agri-700 dark:text-agri-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Post Question</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
