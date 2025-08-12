import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Profile.css";

interface ProfileUser {
  id: number;
  username: string;
  bio?: string | null;
  createdAt?: string;
}
interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  authorId?: number;
  author?: { id: number; username: string };
}

// NOTE: Backend does not yet expose /api/users/:id or /api/posts?authorId=, so this page assumes those endpoints or will fallback.

const ProfilePage: React.FC = () => {
  const { user: current } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<
    "NONE" | "FRIENDS" | "PENDING" | "SELF"
  >("NONE");
  const [sending, setSending] = useState(false);

  // Extract id from path: /profile/123
  const id = Number(window.location.pathname.split("/").pop());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to fetch user - placeholder using search by username or direct endpoint if implemented
      // This expects /api/users/:id to exist; if not, adapt backend.
      const fetched = await api.get<ProfileUser>(`/users/${id}`);
      setProfile(fetched);
      // Determine friend status if backend had an endpoint (not implemented). Placeholder logic:
      if (current && current.id === fetched.id) setFriendStatus("SELF");
      // Fetch posts by author - expects query param support
      try {
        const authorPosts = await api.get<Post[]>(`/posts`, {
          query: { authorId: fetched.id },
        });
        setPosts(authorPosts);
      } catch {
        // fallback: load all and filter client-side
        const all = await api.get<Post[]>(`/posts`);
        setPosts(
          all.filter((p) => (p.author?.id || p.authorId) === fetched.id)
        );
      }
    } catch (e: any) {
      setError(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [id, current]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendFriendRequest() {
    if (!current || !profile) return;
    setSending(true);
    try {
      await api.post("/friends/request", { toId: profile.id });
      setFriendStatus("PENDING");
    } catch (e: any) {
      alert(e.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  }

  async function removeFriend() {
    alert("Remove friend not implemented (needs backend endpoint)");
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6" aria-label="Profile page">
      {loading && <div>Loading profile...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {!loading && profile && (
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          {profile.bio && (
            <p className="text-sm opacity-80 whitespace-pre-line">
              {profile.bio}
            </p>
          )}
          <div className="flex gap-2 items-center text-sm">
            {friendStatus === "SELF" && (
              <span className="px-2 py-1 bg-neutral-800 rounded">
                This is you
              </span>
            )}
            {friendStatus === "NONE" &&
              current &&
              current.id !== profile.id && (
                <button
                  disabled={sending}
                  onClick={sendFriendRequest}
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-sm"
                >
                  {sending ? "Sending..." : "Add Friend"}
                </button>
              )}
            {friendStatus === "PENDING" && (
              <span className="px-2 py-1 bg-yellow-600/60 rounded">
                Request Pending
              </span>
            )}
            {friendStatus === "FRIENDS" && (
              <>
                <span className="px-2 py-1 bg-green-600/60 rounded">
                  Friends
                </span>
                <button
                  onClick={removeFriend}
                  className="px-3 py-1 rounded bg-red-600/70 hover:bg-red-600 text-sm"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </header>
      )}
      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Posts</h2>
        {!posts.length && (
          <div className="text-sm opacity-60">No posts yet</div>
        )}
        <div className="space-y-3">
          {posts.map((p) => (
            <article
              key={p.id}
              className="p-4 rounded bg-neutral-900/70 border border-neutral-800"
              aria-label={`Post ${p.title}`}
            >
              <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
              <p className="text-sm whitespace-pre-line opacity-90">
                {p.content}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
