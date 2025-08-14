import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";

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

interface PostComponentProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: number) => void;
  onUpdate?: () => void;
  isOwnProfile?: boolean;
  enableInlineEdit?: boolean;
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

const PostComponent: React.FC<PostComponentProps> = ({
  post,
  onEdit,
  onDelete,
  onUpdate,
  isOwnProfile = false,
  enableInlineEdit = false,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(
    post.likes?.some((like) => like.userId === user?.id) || false
  );
  const [likeCount, setLikeCount] = useState(
    post._count?.likes || post.likes?.length || 0
  );
  const [commentCount, setCommentCount] = useState(
    post._count?.comments || post.comments?.length || 0
  );
  const [likingPost, setLikingPost] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  // Click outside effect to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(false);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown]);

  const navigateToProfile = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  const toggleLike = async () => {
    if (likingPost) return;

    setLikingPost(true);
    try {
      if (isLiked) {
        await api.del(`/posts/${post.id}/like`);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await api.post(`/posts/${post.id}/like`);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
      onUpdate?.();
    } catch (error) {
      showToast({ message: "Failed to update like", type: "error" });
    } finally {
      setLikingPost(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await api.get<Comment[]>(`/posts/${post.id}/comments`);
      setComments(response);
      setShowComments(true);
    } catch (error) {
      showToast({ message: "Failed to load comments", type: "error" });
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await api.post<Comment>(`/posts/${post.id}/comments`, {
        content: newComment.trim(),
      });
      setComments((prev) => [...prev, response]);
      setCommentCount((prev) => prev + 1);
      setNewComment("");
      onUpdate?.();
    } catch (error) {
      showToast({ message: "Failed to add comment", type: "error" });
    }
  };

  const sharePost = async () => {
    try {
      const shareData = {
        title: post.title,
        text: post.content,
        url: window.location.origin + `/post/${post.id}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showToast({
          message: "Post link copied to clipboard!",
          type: "success",
        });
      }
    } catch (error) {
      // User cancelled or error occurred
    }
  };

  // Inline editing functions
  const startEdit = () => {
    if (enableInlineEdit) {
      setIsEditing(true);
      setEditTitle(post.title);
      setEditContent(post.content);
    } else {
      onEdit?.(post);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const saveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      showToast({ message: "Title and content are required", type: "error" });
      return;
    }

    setSaving(true);
    try {
      await api.put(`/posts/${post.id}`, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });

      // Update the post object
      post.title = editTitle.trim();
      post.content = editContent.trim();

      setIsEditing(false);
      showToast({ message: "Post updated successfully!", type: "success" });
      onUpdate?.();
    } catch (error) {
      showToast({ message: "Failed to update post", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const isOwner =
    isOwnProfile || post.author?.id === user?.id || post.authorId === user?.id;

  return (
    <article className="db-post">
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
        <div className="db-post-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="db-dropdown-trigger"
            onClick={() => setOpenDropdown(!openDropdown)}
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
          {openDropdown && (
            <div className="db-dropdown-menu">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    className="db-dropdown-item"
                    onClick={() => {
                      setOpenDropdown(false);
                      startEdit();
                    }}
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
                    onClick={() => sharePost()}
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
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    Share post
                  </button>
                  <button
                    type="button"
                    className="db-dropdown-item db-dropdown-delete"
                    onClick={() => onDelete?.(post.id)}
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
                      <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                    </svg>
                    Delete post
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="db-dropdown-item"
                  onClick={() => sharePost()}
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
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  Share post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isEditing && enableInlineEdit ? (
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
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </span>
        <span className="db-stat">
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </span>
      </div>

      <div className="db-post-actions-bar">
        <button
          type="button"
          className={`db-action-btn ${isLiked ? "liked" : ""} ${
            likingPost ? "loading" : ""
          }`}
          onClick={toggleLike}
          disabled={likingPost}
        >
          <span className="db-action-icon">
            {likingPost ? (
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
            ) : isLiked ? (
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
            if (showComments) {
              setShowComments(false);
            } else {
              loadComments();
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

        <button type="button" className="db-action-btn" onClick={sharePost}>
          <span className="db-action-icon">
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
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </span>
          <span>Share</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
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
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addComment();
                  }
                }}
                className="db-comment-input"
              />
              <button
                onClick={addComment}
                disabled={!newComment.trim()}
                className="db-comment-submit"
              >
                Post
              </button>
            </div>
          </div>

          {/* Comments list */}
          <div className="db-comments-list">
            {comments.map((comment) => (
              <div key={comment.id} className="db-comment">
                <div className="db-comment-avatar">
                  {comment.user?.profilePicture ? (
                    <img
                      src={comment.user.profilePicture}
                      alt={`${comment.user.username}'s profile`}
                      className="db-avatar-img"
                    />
                  ) : (
                    <div className="db-avatar-placeholder">
                      {comment.user?.username?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <div className="db-comment-content">
                  <div className="db-comment-header">
                    <span className="db-comment-author">
                      {comment.user?.username || "Unknown User"}
                    </span>
                    <span className="db-comment-time">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="db-comment-text">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

export default PostComponent;
