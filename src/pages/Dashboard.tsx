import React, { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { useFeed } from "../context/FeedContext";
import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import BibleStudy from "../components/BibleStudy";
import "../styles/Dashboard.css";

interface FriendUser {
  id: number;
  username: string;
}

interface FriendRequest {
  id: number;
  fromUser: { id: number; username: string };
}

interface Like {
  id: number;
  userId: number;
  user: { id: number; username: string; profilePicture?: string };
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  user?: { id: number; username: string; profilePicture?: string };
}

interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: { id: number; username: string; profilePicture?: string };
  authorId?: number;
  likes?: Like[];
  comments?: Comment[];
  _count?: {
    likes: number;
    comments: number;
  };
}

// Utility: relative time
function timeAgo(iso: string) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return sec + "s ago";
  const min = Math.floor(sec / 60);
  if (min < 60) return min + "m ago";
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + "h ago";
  const day = Math.floor(hr / 24);
  if (day < 7) return day + "d ago";
  return date.toLocaleDateString();
}

const CreatePost: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please add a title and content");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/posts", {
        title: title.trim(),
        content: content.trim(),
      });
      setTitle("");
      setContent("");
      onCreated();
    } catch (e: any) {
      setError(e.message || "Failed to publish");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="db-composer" aria-label="Create post">
      {error && (
        <div className="db-alert" role="alert">
          {error}
        </div>
      )}
      <input
        type="text"
        className="db-composer-title"
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Post title"
      />
      <textarea
        className="db-composer-body"
        placeholder="What's on your heart today?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        aria-label="Post content"
      />
      <div className="db-composer-footer">
        <button
          type="submit"
          className="db-btn-primary"
          disabled={submitting}
          aria-disabled={submitting}
        >
          {submitting ? "Publishing..." : "Publish"}
        </button>
      </div>
    </form>
  );
};

const PostsList: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey } = useFeed();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<{ [postId: number]: string }>(
    {}
  );
  const [showComments, setShowComments] = useState<{
    [postId: number]: boolean;
  }>({});
  const [commentsLoading, setCommentsLoading] = useState<{
    [postId: number]: boolean;
  }>({});
  const [likingPosts, setLikingPosts] = useState<Set<number>>(new Set());
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    postId: number | null;
    postTitle: string;
  }>({ isOpen: false, postId: null, postTitle: "" });
  const [deleting, setDeleting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());

  // Updated load: supports silent refresh and scroll preservation
  const load = useCallback(
    async (opts?: { silent?: boolean; preserveScroll?: boolean }) => {
      const silent = !!opts?.silent;
      const preserveScroll = !!opts?.preserveScroll;
      const prevScroll = preserveScroll ? window.scrollY : 0;

      if (!silent) setLoading(true);
      setError(null);
      try {
        const data = await api.get<Post[]>("/posts");
        // Merge with previous to reduce layout shifts
        setPosts((prev) => {
          const prevMap = new Map(prev.map((p) => [p.id, p]));
          return data.map((p) =>
            prevMap.has(p.id) ? { ...prevMap.get(p.id)!, ...p } : p
          );
        });
      } catch (e: any) {
        setError(e.message || "Failed to load posts");
      } finally {
        if (!silent) setLoading(false);
        if (preserveScroll) {
          requestAnimationFrame(() => {
            window.scrollTo({ top: prevScroll, behavior: "auto" });
          });
        }
      }
    },
    []
  );

  const toggleLike = async (postId: number) => {
    if (likingPosts.has(postId)) return; // Prevent double-clicking

    setLikingPosts((prev) => new Set(prev).add(postId));

    // Optimistic update - immediately update UI
    const currentUser = user!;
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;

        const wasLiked =
          post.likes?.some((like) => like.userId === currentUser.id) || false;

        if (wasLiked) {
          // Remove like optimistically
          return {
            ...post,
            likes:
              post.likes?.filter((like) => like.userId !== currentUser.id) ||
              [],
            _count: {
              ...post._count,
              likes: (post._count?.likes || 0) - 1,
              comments: post._count?.comments || 0,
            },
          };
        } else {
          // Add like optimistically
          const newLike: Like = {
            id: Date.now(), // Temporary ID
            userId: currentUser.id,
            user: {
              id: currentUser.id,
              username: currentUser.username,
              profilePicture: currentUser.profilePicture || undefined,
            },
          };
          return {
            ...post,
            likes: [...(post.likes || []), newLike],
            _count: {
              ...post._count,
              likes: (post._count?.likes || 0) + 1,
              comments: post._count?.comments || 0,
            },
          };
        }
      })
    );

    try {
      await api.post(`/likes/toggle`, { postId });
      // Silent sync to prevent scroll jump
      await load({ silent: true, preserveScroll: true });
    } catch (e: any) {
      console.error("Failed to toggle like:", e);
      // Revert by syncing from server silently
      await load({ silent: true, preserveScroll: true });
    } finally {
      setLikingPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const loadComments = async (postId: number) => {
    if (commentsLoading[postId]) return;

    setCommentsLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const comments = await api.get<Comment[]>(`/comments/${postId}`);
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, comments } : post))
      );
      setShowComments((prev) => ({ ...prev, [postId]: true }));
    } catch (e: any) {
      console.error("Failed to load comments:", e);
    } finally {
      setCommentsLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const addComment = async (postId: number) => {
    const content = newComment[postId]?.trim();
    if (!content) return;

    try {
      await api.post("/comments", {
        postId,
        content,
      });
      setNewComment((prev) => ({ ...prev, [postId]: "" }));
      // Reload comments for this post
      loadComments(postId);
      // Silent refresh to update comment count without jumping
      await load({ silent: true, preserveScroll: true });
    } catch (e: any) {
      console.error("Failed to add comment:", e);
    }
  };

  const deleteComment = async (commentId: number, postId: number) => {
    try {
      await api.del(`/comments/${commentId}`);
      // Reload comments for this post to reflect the deletion
      loadComments(postId);
      // Silent refresh to update comment count without jumping
      await load({ silent: true, preserveScroll: true });
    } catch (e: any) {
      console.error("Failed to delete comment:", e);
    }
  };

  const isLiked = (post: Post) => {
    return post.likes?.some((like) => like.userId === user?.id) || false;
  };

  const getLikeCount = (post: Post) => {
    return post._count?.likes || post.likes?.length || 0;
  };

  const getCommentCount = (post: Post) => {
    return post._count?.comments || post.comments?.length || 0;
  };

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openDropdown &&
        !(event.target as Element).closest(".db-post-dropdown")
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const deletePost = async (id: number) => {
    setDeleting(true);
    setActionError(null);
    try {
      await api.del(`/posts/${id}`);
      await load({ silent: true, preserveScroll: true });
      setDeleteModal({ isOpen: false, postId: null, postTitle: "" });
    } catch (e: any) {
      setActionError(e.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (post: Post) => {
    setDeleteModal({
      isOpen: true,
      postId: post.id,
      postTitle: post.title,
    });
  };

  const toggleDropdown = (postId: number) => {
    setOpenDropdown(openDropdown === postId ? null : postId);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  const sharePost = async (post: Post) => {
    closeDropdown();
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error occurred
        copyToClipboard(post);
      }
    } else {
      copyToClipboard(post);
    }
  };

  const copyToClipboard = (post: Post) => {
    const text = `${post.title}\n\n${post.content}\n\nShared from Daily Bread`;
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log("Post copied to clipboard");
    });
  };

  const toggleSavePost = (postId: number) => {
    closeDropdown();
    setSavedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
    // Here you could also make an API call to save/unsave the post
  };

  const navigateToProfile = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  const editPost = (post: Post) => {
    closeDropdown();
    startEdit(post);
  };

  const deletePostAction = (post: Post) => {
    closeDropdown();
    openDeleteModal(post);
  };

  const startEdit = (post: Post) => {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setActionError(null);
    try {
      await api.put(`/posts/${editingId}`, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setEditingId(null);
      load();
    } catch (e: any) {
      setActionError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="db-stack" aria-label="Loading posts">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="db-post-skeleton">
            <div className="line w40" />
            <div className="line w70" />
            <div className="line w90" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="db-alert" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="db-stack">
      {actionError && (
        <div className="db-alert" role="alert">
          {actionError}
        </div>
      )}
      {posts.length === 0 ? (
        <div className="db-empty">
          <p>No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        posts.map((post) => (
          <article key={post.id} className="db-post">
            <div className="db-post-header">
              <div
                className="db-post-avatar"
                onClick={() => navigateToProfile(post.author.id)}
                style={{ cursor: "pointer" }}
                title={`Go to ${post.author.username}'s profile`}
              >
                {post.author.profilePicture ? (
                  <img
                    src={post.author.profilePicture}
                    alt={`${post.author.username}'s profile`}
                    className="db-avatar-img"
                  />
                ) : (
                  <div className="db-avatar-placeholder">
                    {post.author.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="db-post-meta">
                <div
                  className="db-post-author"
                  onClick={() => navigateToProfile(post.author.id)}
                  style={{ cursor: "pointer" }}
                  title={`Go to ${post.author.username}'s profile`}
                >
                  {post.author.username}
                </div>
                <div className="db-post-time">{timeAgo(post.createdAt)}</div>
              </div>
              <div className="db-post-dropdown">
                <button
                  type="button"
                  className="db-dropdown-trigger"
                  onClick={() => toggleDropdown(post.id)}
                  aria-label="Post options"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
                {openDropdown === post.id && (
                  <div className="db-dropdown-menu">
                    {user?.id === post.authorId ? (
                      <>
                        <button
                          type="button"
                          className="db-dropdown-item"
                          onClick={() => editPost(post)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="m18 2 4 4-14 14H4v-4L18 2z"></path>
                            <path d="m14.5 5.5 4 4"></path>
                          </svg>
                          Edit post
                        </button>
                        <button
                          type="button"
                          className="db-dropdown-item"
                          onClick={() => sharePost(post)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line
                              x1="8.59"
                              y1="13.51"
                              x2="15.42"
                              y2="17.49"
                            ></line>
                            <line
                              x1="15.41"
                              y1="6.51"
                              x2="8.59"
                              y2="10.49"
                            ></line>
                          </svg>
                          Share
                        </button>
                        <button
                          type="button"
                          className="db-dropdown-item danger"
                          onClick={() => deletePostAction(post)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="db-dropdown-item"
                          onClick={() => toggleSavePost(post.id)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="m19,21-7-4-7,4V5a2,2 0 0,1,2-2H17a2,2 0 0,1,2,2V21z"></path>
                          </svg>
                          {savedPosts.has(post.id) ? "Unsave" : "Save"}
                        </button>
                        <button
                          type="button"
                          className="db-dropdown-item"
                          onClick={() => sharePost(post)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line
                              x1="8.59"
                              y1="13.51"
                              x2="15.42"
                              y2="17.49"
                            ></line>
                            <line
                              x1="15.41"
                              y1="6.51"
                              x2="8.59"
                              y2="10.49"
                            ></line>
                          </svg>
                          Share
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {editingId === post.id ? (
              <div className="db-edit-form">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="db-edit-title"
                  placeholder="Post title"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="db-edit-content"
                  placeholder="Post content"
                  rows={4}
                />
                <div className="db-edit-actions">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="db-btn-primary"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={cancelEdit} className="db-btn-ghost">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="db-post-content">
                <h3 className="db-post-title">{post.title}</h3>
                <p className="db-post-body">{post.content}</p>
              </div>
            )}

            {/* Post interactions */}
            <div className="db-post-stats">
              <span className="db-stat">
                {getLikeCount(post)}{" "}
                {getLikeCount(post) === 1 ? "like" : "likes"}
              </span>
              <span className="db-stat">
                {getCommentCount(post)}{" "}
                {getCommentCount(post) === 1 ? "comment" : "comments"}
              </span>
            </div>

            <div className="db-post-actions-bar">
              <button
                type="button"
                className={`db-action-btn ${isLiked(post) ? "liked" : ""} ${
                  likingPosts.has(post.id) ? "loading" : ""
                }`}
                onClick={() => toggleLike(post.id)}
                disabled={likingPosts.has(post.id)}
              >
                <span className="db-action-icon">
                  {likingPosts.has(post.id) ? (
                    <svg
                      className="loading-spinner"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray="31.416"
                        strokeDashoffset="31.416"
                      >
                        <animate
                          attributeName="stroke-dasharray"
                          dur="2s"
                          values="0 31.416;15.708 15.708;0 31.416"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-dashoffset"
                          dur="2s"
                          values="0;-15.708;-31.416"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </svg>
                  ) : isLiked(post) ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  )}
                </span>
                <span>Like</span>
              </button>

              <button
                type="button"
                className="db-action-btn"
                onClick={() => {
                  if (showComments[post.id]) {
                    setShowComments((prev) => ({ ...prev, [post.id]: false }));
                  } else {
                    loadComments(post.id);
                  }
                }}
              >
                <span className="db-action-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <span>Comment</span>
              </button>
            </div>

            {/* Comments section */}
            {showComments[post.id] && (
              <div className="db-comments-section">
                {/* Add comment form */}
                <div className="db-comment-form">
                  <div className="db-comment-avatar">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Your profile"
                        className="db-avatar-img"
                      />
                    ) : (
                      <div className="db-avatar-placeholder">
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="db-comment-input-container">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={newComment[post.id] || ""}
                      onChange={(e) =>
                        setNewComment((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          addComment(post.id);
                        }
                      }}
                      className="db-comment-input"
                    />
                    <button
                      onClick={() => addComment(post.id)}
                      disabled={!newComment[post.id]?.trim()}
                      className="db-comment-submit"
                    >
                      Post
                    </button>
                  </div>
                </div>

                {/* Comments list */}
                <div className="db-comments-list">
                  {commentsLoading[post.id] ? (
                    <div className="db-comment-loading">
                      Loading comments...
                    </div>
                  ) : (
                    post.comments?.map((comment) => (
                      <div key={comment.id} className="db-comment">
                        <div className="db-comment-avatar">
                          {comment.user?.profilePicture ? (
                            <img
                              src={comment.user.profilePicture}
                              alt={`${
                                comment.user.username || "User"
                              }'s profile`}
                              className="db-avatar-img"
                            />
                          ) : (
                            <div className="db-avatar-placeholder">
                              {comment.user?.username
                                ?.charAt(0)
                                .toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                        <div className="db-comment-content">
                          <div className="db-comment-bubble">
                            <div className="db-comment-header">
                              <div className="db-comment-author">
                                {comment.user?.username || "Unknown User"}
                              </div>
                              {user?.id === comment.userId && (
                                <button
                                  type="button"
                                  className="db-comment-delete"
                                  onClick={() =>
                                    deleteComment(comment.id, post.id)
                                  }
                                  title="Delete comment"
                                  aria-label="Delete comment"
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="3,6 5,6 21,6"></polyline>
                                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                    <line
                                      x1="10"
                                      y1="11"
                                      x2="10"
                                      y2="17"
                                    ></line>
                                    <line
                                      x1="14"
                                      y1="11"
                                      x2="14"
                                      y2="17"
                                    ></line>
                                  </svg>
                                </button>
                              )}
                            </div>
                            <div className="db-comment-text">
                              {comment.content}
                            </div>
                          </div>
                          <div className="db-comment-time">
                            {timeAgo(comment.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </article>
        ))
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div
          className="db-modal-overlay"
          onClick={() =>
            setDeleteModal({ isOpen: false, postId: null, postTitle: "" })
          }
        >
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-header">
              <h3>Delete Post</h3>
              <button
                type="button"
                className="db-modal-close"
                onClick={() =>
                  setDeleteModal({ isOpen: false, postId: null, postTitle: "" })
                }
                aria-label="Close"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="db-modal-body">
              <div className="db-modal-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e41e3f"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <p className="db-modal-message">
                Are you sure you want to delete{" "}
                <strong>"{deleteModal.postTitle}"</strong>?
              </p>
              <p className="db-modal-submessage">
                This action cannot be undone. Your post will be permanently
                removed.
              </p>
            </div>
            <div className="db-modal-footer">
              <button
                type="button"
                className="db-btn-secondary"
                onClick={() =>
                  setDeleteModal({ isOpen: false, postId: null, postTitle: "" })
                }
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="db-btn-danger"
                onClick={() =>
                  deleteModal.postId && deletePost(deleteModal.postId)
                }
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <svg
                      className="loading-spinner"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray="31.416"
                        strokeDashoffset="31.416"
                      >
                        <animate
                          attributeName="stroke-dasharray"
                          dur="2s"
                          values="0 31.416;15.708 15.708;0 31.416"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-dashoffset"
                          dur="2s"
                          values="0;-15.708;-31.416"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete Post"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FriendsActivity: React.FC = () => {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFriendsData = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        api.get<FriendUser[]>("/friends"),
        api.get<FriendRequest[]>("/friends/requests"),
      ]);
      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch (e) {
      console.error("Failed to load friends data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriendsData();
  }, [loadFriendsData]);

  const acceptRequest = async (requestId: number) => {
    try {
      await api.post(`/friends/requests/${requestId}/accept`);
      loadFriendsData();
    } catch (e) {
      console.error("Failed to accept request:", e);
    }
  };

  const declineRequest = async (requestId: number) => {
    try {
      await api.post(`/friends/requests/${requestId}/decline`);
      loadFriendsData();
    } catch (e) {
      console.error("Failed to decline request:", e);
    }
  };

  if (loading) {
    return (
      <div className="db-widget">
        <h3>Loading...</h3>
      </div>
    );
  }

  return (
    <div className="db-widget">
      <h3>Friends Activity</h3>

      {friendRequests.length > 0 && (
        <div className="db-requests">
          <h4>Friend Requests</h4>
          {friendRequests.map((req) => (
            <div key={req.id} className="db-request">
              <span>{req.fromUser.username}</span>
              <div className="db-request-actions">
                <button
                  onClick={() => acceptRequest(req.id)}
                  className="db-btn-accept"
                >
                  Accept
                </button>
                <button
                  onClick={() => declineRequest(req.id)}
                  className="db-btn-decline"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="db-friends-list">
        <h4>Friends ({friends.length})</h4>
        {friends.length === 0 ? (
          <p className="db-empty-text">No friends yet</p>
        ) : (
          friends.map((friend) => (
            <div key={friend.id} className="db-friend">
              <span>{friend.username}</span>
              <span className="db-status-online">●</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user, loading: authLoading, loggingOut } = useAuth();
  const { sidebarCollapsed, activeSection } = useSidebar();

  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
    return () => document.body.classList.remove("sidebar-collapsed");
  }, [sidebarCollapsed]);

  if (authLoading || loggingOut) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="db-wrapper">
      <Navbar />
      <LeftSidebar collapsed={sidebarCollapsed} />
      <div className="db-shell">
        <main className="db-main">
          {activeSection === "study" ? (
            <BibleStudy />
          ) : (
            <div className="db-feed-container">
              <CreatePost onCreated={() => window.location.reload()} />
              <PostsList />
            </div>
          )}
        </main>
        {activeSection !== "study" && (
          <aside className="db-right">
            <FriendsActivity />
          </aside>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
