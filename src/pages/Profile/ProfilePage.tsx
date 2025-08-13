import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import { useFeed } from "../../context/FeedContext";
import Navbar from "../../components/Navbar";
import LeftSidebar from "../../components/LeftSidebar";
import "../../styles/ModernProfile.css";
import { useToast } from "../../context/ToastContext";

interface ProfileUser {
  id: number;
  username: string;
  email?: string;
  bio?: string | null;
  profilePicture?: string | null;
  createdAt?: string;
  postsCount?: number;
  friendsCount?: number;
  followersCount?: number;
  followingCount?: number;
}

interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author?: { id: number; username: string };
}

interface ProfileFormData {
  username: string;
  email: string;
  bio: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, refresh } = useAuth();
  const { sidebarCollapsed } = useSidebar();
  const { refreshFeed } = useFeed();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [postActionLoading, setPostActionLoading] = useState(false);
  const [postActionError, setPostActionError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "about" | "settings">(
    "posts"
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    username: "",
    email: "",
    bio: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<ProfileFormData>>({});

  // Post edit helpers
  function cancelEditPost() {
    setEditingPostId(null);
    setEditTitle("");
    setEditContent("");
    setPostActionError(null);
    setPostActionLoading(false);
  }

  async function handleSavePost(id: number) {
    if (!editTitle.trim() || !editContent.trim()) {
      setPostActionError("Title & content required");
      return;
    }
    setPostActionLoading(true);
    setPostActionError(null);
    try {
      const updated = await api.put<Post>(`/posts/${id}`, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, title: updated.title, content: updated.content }
            : p
        )
      );
      cancelEditPost();
    } catch (e: any) {
      setPostActionError(e.message || "Update failed");
    } finally {
      setPostActionLoading(false);
    }
  }

  async function handleDeletePost(id: number) {
    if (!window.confirm("Delete this post?")) return;
    setPostActionLoading(true);
    setPostActionError(null);
    try {
      await api.del(`/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (editingPostId === id) cancelEditPost();
    } catch (e: any) {
      setPostActionError(e.message || "Delete failed");
    } finally {
      setPostActionLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
    return () => document.body.classList.remove("sidebar-collapsed");
  }, [sidebarCollapsed]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // If no ID is provided or ID matches current user, show current user's profile
      if (currentUser && (id === String(currentUser.id) || !id)) {
        const profileData: ProfileUser = {
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email || "",
          bio: currentUser.bio || "",
          profilePicture: currentUser.profilePicture || null,
          createdAt: currentUser.createdAt,
          postsCount: 12, // Mock data
          friendsCount: 8, // Mock data
        };
        setProfile(profileData);
        setIsOwnProfile(true);
        setFormData({
          username: profileData.username,
          email: profileData.email || "",
          bio: profileData.bio || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // Load user's posts
        try {
          const userPosts = await api.get<Post[]>("/posts");
          setPosts(userPosts.slice(0, 5)); // Show recent posts
        } catch {
          setPosts([]);
        }
      } else if (id) {
        // Fetch other user's profile
        try {
          const userProfile = await api.get<ProfileUser>(`/users/${id}`);
          setProfile(userProfile);
          setIsOwnProfile(false);

          // Check follow status for other users
          if (currentUser) {
            await checkFollowStatus(userProfile.id);
          }

          // Load user's posts
          try {
            const userPosts = await api.get<Post[]>(`/users/${id}/posts`);
            setPosts(userPosts);
          } catch {
            setPosts([]);
          }
        } catch (error: any) {
          if (error.message.includes("User not found")) {
            setError("User not found");
          } else {
            setError("Failed to load profile");
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async (userId: number) => {
    if (!currentUser || currentUser.id === userId) return;

    try {
      const response = await api.get<{ isFollowing: boolean }>(
        `/follow/${userId}/status`
      );
      setIsFollowing(response.isFollowing);
    } catch (error) {
      console.error("Failed to check follow status:", error);
    }
  };

  const handleFollow = async () => {
    if (!profile || !currentUser || currentUser.id === profile.id) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.del(`/follow/${profile.id}`);
        setIsFollowing(false);
        showToast({ message: "Unfollowed successfully", type: "success" });
        // Refresh the feed to remove unfollowed user's posts
        refreshFeed();
      } else {
        await api.post(`/follow/${profile.id}`);
        setIsFollowing(true);
        showToast({ message: "Followed successfully", type: "success" });
        // Refresh the feed to include followed user's posts
        refreshFeed();
      }
    } catch (error: any) {
      showToast({
        message: error.message || "Failed to update follow status",
        type: "error",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name as keyof ProfileFormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<ProfileFormData> = {};

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        errors.currentPassword =
          "Current password is required to change password";
      }
      if (formData.newPassword.length < 6) {
        errors.newPassword = "New password must be at least 6 characters";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError(null);
    try {
      // 1) Update basic profile fields
      let profileUpdated = false;
      try {
        const updated = await api.put<ProfileUser>("/auth/profile", {
          username: formData.username,
          email: formData.email,
          bio: formData.bio,
        });
        profileUpdated = true;
        // Update local state optimistically
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                username: updated.username ?? formData.username,
                email: updated.email ?? formData.email,
                bio: updated.bio ?? formData.bio,
              }
            : prev
        );
        // Only show profile toast if no password change is requested,
        // to avoid showing two success toasts.
        if (!formData.newPassword) {
          showToast({ type: "success", message: "Profile updated" });
        }
      } catch (e: any) {
        // Surface specific error but continue to try password update
        const msg = e?.error || e?.message || "Failed to update profile";
        setError(msg);
        showToast({ type: "error", message: msg });
      }

      // 2) Update password if requested
      let passwordUpdated = false;
      if (formData.newPassword) {
        try {
          await api.put("/auth/password", {
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          });
          passwordUpdated = true;
          showToast({ type: "success", message: "Password changed" });
        } catch (e: any) {
          const msg = e?.error || e?.message || "Failed to update password";
          setError(msg);
          showToast({ type: "error", message: msg });
        }
      }

      // 3) If anything changed successfully, refresh auth context and clean up
      if (profileUpdated || passwordUpdated) {
        await refresh();
        // Clear password fields regardless after attempt
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));

        // Exit editing mode when there were successful changes
        setIsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setError("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;

          // Send to backend
          await api.put("/auth/profile-picture", {
            profilePicture: base64String,
          });

          // Update local state
          setProfile((prev) =>
            prev ? { ...prev, profilePicture: base64String } : null
          );

          // Refresh auth context to update navbar
          await refresh();
        } catch (err: any) {
          setError(err.message || "Failed to upload profile picture");
        } finally {
          setUploading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Failed to process image");
      setUploading(false);
    }
  };

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="db-wrapper">
        <Navbar />
        <LeftSidebar collapsed={sidebarCollapsed} />
        <div className="profile-loading">
          <div className="profile-loading-text">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="db-wrapper">
        <Navbar />
        <LeftSidebar collapsed={sidebarCollapsed} />
        <div className="profile-error">
          <div className="profile-error-text">{error}</div>
          <button onClick={loadProfile} className="profile-error-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="db-wrapper">
      <Navbar />
      <LeftSidebar collapsed={sidebarCollapsed} />
      <div className="modern-profile-container">
        {/* Cover Photo Section */}
        <div className="modern-profile-cover">
          <div className="modern-cover-photo">
            {/* Gradient background instead of image for now */}
          </div>

          {/* Profile Info Overlay */}
          <div className="modern-profile-header">
            <div className="modern-profile-main">
              {/* Avatar */}
              <div className="modern-avatar-wrapper">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.username}
                    className="modern-avatar"
                  />
                ) : (
                  <div className="modern-avatar modern-avatar-fallback">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
                {isOwnProfile && (
                  <label className="modern-avatar-edit">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      disabled={uploading}
                      className="modern-avatar-input"
                    />
                    <div className="modern-avatar-edit-icon">
                      {uploading ? "⏳" : "📷"}
                    </div>
                  </label>
                )}
              </div>

              {/* Name and Info */}
              <div className="modern-profile-info">
                <h1 className="modern-profile-name">{profile.username}</h1>
                {profile.bio && (
                  <p className="modern-profile-bio">{profile.bio}</p>
                )}
                <div className="modern-profile-meta">
                  <span className="modern-profile-joined">
                    📅 Joined{" "}
                    {profile.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString()
                      : "Recently"}
                  </span>
                  {isOwnProfile && profile.email && (
                    <span className="modern-profile-email">
                      ✉️ {profile.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="modern-profile-actions">
                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="modern-btn modern-btn-primary"
                  >
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </button>
                ) : (
                  <button
                    className="modern-btn modern-btn-outline"
                    onClick={handleFollow}
                    disabled={followLoading}
                  >
                    {followLoading
                      ? "..."
                      : isFollowing
                      ? "Unfollow"
                      : "Follow"}
                  </button>
                )}
              </div>
            </div>

            {/* Stats Bar */}
            <div className="modern-stats-bar">
              <div className="modern-stat">
                <span className="modern-stat-number">
                  {profile.postsCount || 0}
                </span>
                <span className="modern-stat-label">Posts</span>
              </div>
              <div className="modern-stat">
                <span className="modern-stat-number">
                  {profile.followingCount || 0}
                </span>
                <span className="modern-stat-label">Following</span>
              </div>
              <div className="modern-stat">
                <span className="modern-stat-number">
                  {profile.followersCount || 0}
                </span>
                <span className="modern-stat-label">Followers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area with Side Navigation */}
        <div className="modern-content-layout">
          {/* Side Navigation */}
          <div className="modern-side-nav">
            <div
              className="modern-nav-item"
              onClick={() => setActiveTab("posts")}
            >
              <div
                className={`modern-nav-card ${
                  activeTab === "posts" ? "active" : ""
                }`}
              >
                <div className="modern-nav-icon">📝</div>
                <div className="modern-nav-text">
                  <div className="modern-nav-title">Posts</div>
                  <div className="modern-nav-subtitle">
                    {posts.length} posts
                  </div>
                </div>
              </div>
            </div>

            <div
              className="modern-nav-item"
              onClick={() => setActiveTab("about")}
            >
              <div
                className={`modern-nav-card ${
                  activeTab === "about" ? "active" : ""
                }`}
              >
                <div className="modern-nav-icon">ℹ️</div>
                <div className="modern-nav-text">
                  <div className="modern-nav-title">About</div>
                  <div className="modern-nav-subtitle">Profile info</div>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div
                className="modern-nav-item"
                onClick={() => setActiveTab("settings")}
              >
                <div
                  className={`modern-nav-card ${
                    activeTab === "settings" ? "active" : ""
                  }`}
                >
                  <div className="modern-nav-icon">⚙️</div>
                  <div className="modern-nav-text">
                    <div className="modern-nav-title">Settings</div>
                    <div className="modern-nav-subtitle">Edit profile</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="modern-main-content">
            {activeTab === "posts" && (
              <div className="modern-posts-section">
                {posts.length > 0 ? (
                  <div className="modern-posts-grid">
                    {posts.map((post) => {
                      const isOwner =
                        isOwnProfile || post.author?.id === currentUser?.id;
                      const isEditing = editingPostId === post.id;
                      return (
                        <div
                          key={post.id}
                          className={`modern-post-card ${
                            isEditing ? "editing" : ""
                          }`}
                        >
                          <div className="modern-post-header">
                            <span className="modern-post-date">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                            {isOwner && !isEditing && (
                              <div className="modern-post-actions">
                                <button
                                  type="button"
                                  className="modern-post-action-btn"
                                  title="Edit post"
                                  onClick={() => {
                                    setEditingPostId(post.id);
                                    setEditTitle(post.title);
                                    setEditContent(post.content);
                                    setPostActionError(null);
                                  }}
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  className="modern-post-action-btn modern-post-delete"
                                  title="Delete post"
                                  disabled={postActionLoading}
                                  onClick={() => handleDeletePost(post.id)}
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </div>

                          {!isEditing ? (
                            <>
                              <h3 className="modern-post-title">
                                {post.title}
                              </h3>
                              <p className="modern-post-content">
                                {post.content.length > 200
                                  ? `${post.content.substring(0, 200)}...`
                                  : post.content}
                              </p>
                            </>
                          ) : (
                            <div className="modern-post-edit-form">
                              <input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="modern-edit-title"
                                placeholder="Post title"
                                disabled={postActionLoading}
                              />
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={4}
                                className="modern-edit-content"
                                placeholder="Post content"
                                disabled={postActionLoading}
                              />
                              {postActionError && (
                                <div className="modern-error-message">
                                  {postActionError}
                                </div>
                              )}
                              <div className="modern-edit-actions">
                                <button
                                  type="button"
                                  className="modern-btn modern-btn-ghost"
                                  onClick={() => cancelEditPost()}
                                  disabled={postActionLoading}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="modern-btn modern-btn-primary"
                                  onClick={() => handleSavePost(post.id)}
                                  disabled={postActionLoading}
                                >
                                  {postActionLoading ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="modern-empty-state">
                    <div className="modern-empty-icon">📝</div>
                    <h3>No posts yet</h3>
                    <p>
                      When {isOwnProfile ? "you" : profile.username} posts,
                      they'll show up here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "about" && (
              <div className="modern-about-section">
                <div className="modern-about-card">
                  <h3 className="modern-section-title">
                    About {profile.username}
                  </h3>
                  <div className="modern-about-grid">
                    <div className="modern-about-item">
                      <div className="modern-about-label">Username</div>
                      <div className="modern-about-value">
                        {profile.username}
                      </div>
                    </div>
                    <div className="modern-about-item">
                      <div className="modern-about-label">Email</div>
                      <div className="modern-about-value">
                        {isOwnProfile ? profile.email : "Private"}
                      </div>
                    </div>
                    <div className="modern-about-item">
                      <div className="modern-about-label">Bio</div>
                      <div className="modern-about-value">
                        {profile.bio || "No bio added yet"}
                      </div>
                    </div>
                    <div className="modern-about-item">
                      <div className="modern-about-label">Member since</div>
                      <div className="modern-about-value">
                        {profile.createdAt
                          ? new Date(profile.createdAt).toLocaleDateString()
                          : "Recently"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && isOwnProfile && (
              <div className="modern-settings-section">
                <div className="modern-settings-card">
                  <h3 className="modern-section-title">Profile Settings</h3>

                  {error && <div className="modern-error-banner">{error}</div>}

                  <form
                    onSubmit={handleSaveProfile}
                    className="modern-settings-form"
                  >
                    <div className="modern-form-section">
                      <h4 className="modern-form-section-title">
                        Basic Information
                      </h4>

                      <div className="modern-form-group">
                        <label htmlFor="username" className="modern-label">
                          Username
                        </label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`modern-input ${
                            formErrors.username ? "error" : ""
                          }`}
                          required
                        />
                        {formErrors.username && (
                          <span className="modern-error-text">
                            {formErrors.username}
                          </span>
                        )}
                      </div>

                      <div className="modern-form-group">
                        <label htmlFor="email" className="modern-label">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`modern-input ${
                            formErrors.email ? "error" : ""
                          }`}
                          required
                        />
                        {formErrors.email && (
                          <span className="modern-error-text">
                            {formErrors.email}
                          </span>
                        )}
                      </div>

                      <div className="modern-form-group">
                        <label htmlFor="bio" className="modern-label">
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          className="modern-textarea"
                          rows={3}
                          placeholder="Tell others about yourself..."
                        />
                      </div>
                    </div>

                    <div className="modern-form-section">
                      <h4 className="modern-form-section-title">
                        Change Password
                      </h4>

                      <div className="modern-form-group">
                        <label
                          htmlFor="currentPassword"
                          className="modern-label"
                        >
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className={`modern-input ${
                            formErrors.currentPassword ? "error" : ""
                          }`}
                          placeholder="Enter current password"
                        />
                        {formErrors.currentPassword && (
                          <span className="modern-error-text">
                            {formErrors.currentPassword}
                          </span>
                        )}
                      </div>

                      <div className="modern-form-group">
                        <label htmlFor="newPassword" className="modern-label">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className={`modern-input ${
                            formErrors.newPassword ? "error" : ""
                          }`}
                          placeholder="Enter new password"
                        />
                        {formErrors.newPassword && (
                          <span className="modern-error-text">
                            {formErrors.newPassword}
                          </span>
                        )}
                      </div>

                      <div className="modern-form-group">
                        <label
                          htmlFor="confirmPassword"
                          className="modern-label"
                        >
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`modern-input ${
                            formErrors.confirmPassword ? "error" : ""
                          }`}
                          placeholder="Confirm new password"
                        />
                        {formErrors.confirmPassword && (
                          <span className="modern-error-text">
                            {formErrors.confirmPassword}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="modern-form-actions">
                      <button
                        type="submit"
                        disabled={saving}
                        className="modern-btn modern-btn-primary modern-btn-lg"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
