import React, { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { useFeed } from "../context/FeedContext";
// useToast import removed - handled by PostComponent
import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import BibleStudy from "../components/BibleStudy";
import PostComponent from "../components/PostComponent";
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

// Bible verse interfaces removed - handled by PostComponent

// Bible books with abbreviations (commented out - now handled by PostComponent)
/*
const BIBLE_BOOKS = [
  { name: "Genesis", abbreviations: ["Gen", "Ge", "Gn"] },
  { name: "Exodus", abbreviations: ["Exo", "Ex"] },
  { name: "Leviticus", abbreviations: ["Lev", "Le", "Lv"] },
  { name: "Numbers", abbreviations: ["Num", "Nu", "Nm", "Nb"] },
  { name: "Deuteronomy", abbreviations: ["Deu", "De", "Dt"] },
  { name: "Joshua", abbreviations: ["Jos", "Jsh"] },
  { name: "Judges", abbreviations: ["Jdg", "Jg", "Jgs"] },
  { name: "Ruth", abbreviations: ["Rth", "Ru"] },
  { name: "1 Samuel", abbreviations: ["1Sa", "1 Sam", "1Sam", "1 Sm", "1Sm"] },
  { name: "2 Samuel", abbreviations: ["2Sa", "2 Sam", "2Sam", "2 Sm", "2Sm"] },
  { name: "1 Kings", abbreviations: ["1Ki", "1 Kin", "1Kin", "1 Kgs", "1Kgs"] },
  { name: "2 Kings", abbreviations: ["2Ki", "2 Kin", "2Kin", "2 Kgs", "2Kgs"] },
  {
    name: "1 Chronicles",
    abbreviations: ["1Ch", "1 Chr", "1Chr", "1 Chron", "1Chron"],
  },
  {
    name: "2 Chronicles",
    abbreviations: ["2Ch", "2 Chr", "2Chr", "2 Chron", "2Chron"],
  },
  { name: "Ezra", abbreviations: ["Ezr", "Ez"] },
  { name: "Nehemiah", abbreviations: ["Neh", "Ne"] },
  { name: "Esther", abbreviations: ["Est", "Es"] },
  { name: "Job", abbreviations: ["Jb"] },
  { name: "Psalms", abbreviations: ["Psa", "Ps", "Psalm"] },
  { name: "Proverbs", abbreviations: ["Pro", "Pr", "Prv"] },
  { name: "Ecclesiastes", abbreviations: ["Ecc", "Ec", "Eccl"] },
  { name: "Song of Solomon", abbreviations: ["Son", "So", "SoS", "Song"] },
  { name: "Isaiah", abbreviations: ["Isa", "Is"] },
  { name: "Jeremiah", abbreviations: ["Jer", "Je", "Jr"] },
  { name: "Lamentations", abbreviations: ["Lam", "La"] },
  { name: "Ezekiel", abbreviations: ["Eze", "Ezk", "Ez"] },
  { name: "Daniel", abbreviations: ["Dan", "Da", "Dn"] },
  { name: "Hosea", abbreviations: ["Hos", "Ho"] },
  { name: "Joel", abbreviations: ["Joe", "Jl"] },
  { name: "Amos", abbreviations: ["Amo", "Am"] },
  { name: "Obadiah", abbreviations: ["Oba", "Ob"] },
  { name: "Jonah", abbreviations: ["Jon", "Jnh"] },
  { name: "Micah", abbreviations: ["Mic", "Mi"] },
  { name: "Nahum", abbreviations: ["Nah", "Na"] },
  { name: "Habakkuk", abbreviations: ["Hab", "Hb"] },
  { name: "Zephaniah", abbreviations: ["Zep", "Ze"] },
  { name: "Haggai", abbreviations: ["Hag", "Hg"] },
  { name: "Zechariah", abbreviations: ["Zec", "Zc"] },
  { name: "Malachi", abbreviations: ["Mal", "Ml"] },
  { name: "Matthew", abbreviations: ["Mat", "Mt"] },
  { name: "Mark", abbreviations: ["Mar", "Mk", "Mr"] },
  { name: "Luke", abbreviations: ["Luk", "Lk"] },
  { name: "John", abbreviations: ["Joh", "Jn"] },
  { name: "Acts", abbreviations: ["Act", "Ac"] },
  { name: "Romans", abbreviations: ["Rom", "Ro", "Rm"] },
  { name: "1 Corinthians", abbreviations: ["1Co", "1 Cor", "1Cor"] },
  { name: "2 Corinthians", abbreviations: ["2Co", "2 Cor", "2Cor"] },
  { name: "Galatians", abbreviations: ["Gal", "Ga"] },
  { name: "Ephesians", abbreviations: ["Eph", "Ep"] },
  { name: "Philippians", abbreviations: ["Phi", "Ph", "Php"] },
  { name: "Colossians", abbreviations: ["Col", "Co"] },
  { name: "1 Thessalonians", abbreviations: ["1Th", "1 Thess", "1Thess"] },
  { name: "2 Thessalonians", abbreviations: ["2Th", "2 Thess", "2Thess"] },
  { name: "1 Timothy", abbreviations: ["1Ti", "1 Tim", "1Tim"] },
  { name: "2 Timothy", abbreviations: ["2Ti", "2 Tim", "2Tim"] },
  { name: "Titus", abbreviations: ["Tit", "Ti"] },
  { name: "Philemon", abbreviations: ["Phm", "Pm"] },
  { name: "Hebrews", abbreviations: ["Heb", "He"] },
  { name: "James", abbreviations: ["Jam", "Jas", "Jm"] },
  { name: "1 Peter", abbreviations: ["1Pe", "1 Pet", "1Pet"] },
  { name: "2 Peter", abbreviations: ["2Pe", "2 Pet", "2Pet"] },
  { name: "1 John", abbreviations: ["1Jo", "1 Jn", "1Jn"] },
  { name: "2 John", abbreviations: ["2Jo", "2 Jn", "2Jn"] },
  { name: "3 John", abbreviations: ["3Jo", "3 Jn", "3Jn"] },
  { name: "Jude", abbreviations: ["Jud", "Jd"] },
  { name: "Revelation", abbreviations: ["Rev", "Re", "Rv"] },
];
*/

// Bulgarian mapping also commented out - handled by PostComponent
/*
const BG_BOOK_MAP: Record<string, string> = {
  // Стар завет
  Битие: "Genesis",
  Изход: "Exodus",
  Левит: "Leviticus",
  Числа: "Numbers",
  Второзаконие: "Deuteronomy",
  "Иисус Навин": "Joshua",
  Съдии: "Judges",
  Рут: "Ruth",
  "1 Царе": "1 Samuel",
  "2 Царе": "2 Samuel",
  "3 Царе": "1 Kings",
  "4 Царе": "2 Kings",
  "1 Летописи": "1 Chronicles",
  "2 Летописи": "2 Chronicles",
  Ездра: "Ezra",
  Неемия: "Nehemiah",
  Естир: "Esther",
  Йов: "Job",
  Псалми: "Psalms",
  Псалм: "Psalms",
  Пс: "Psalms",
  Притчи: "Proverbs",
  Еклесиаст: "Ecclesiastes",
  "Песен на песните": "Song of Solomon",
  Исая: "Isaiah",
  Йеремия: "Jeremiah",
  "Плач Йеремиев": "Lamentations",
  Йезекиил: "Ezekiel",
  Данаил: "Daniel",
  Осия: "Hosea",
  Йоил: "Joel",
  Амос: "Amos",
  Авдий: "Obadiah",
  Йона: "Jonah",
  Михей: "Micah",
  Наум: "Nahum",
  Авакум: "Habakkuk",
  Софоний: "Zephaniah",
  Агей: "Haggai",
  Захария: "Zechariah",
  Малахия: "Malachi",
  // Нов завет
  Матей: "Matthew",
  Марк: "Mark",
  Лука: "Luke",
  Йоан: "John",
  Деяния: "Acts",
  Римляни: "Romans",
  "1 Коринтяни": "1 Corinthians",
  "2 Коринтяни": "2 Corinthians",
  Галатяни: "Galatians",
  Ефесяни: "Ephesians",
  Филипяни: "Philippians",
  Колосяни: "Colossians",
  "1 Солунци": "1 Thessalonians",
  "2 Солунци": "2 Thessalonians",
  "1 Тимотей": "1 Timothy",
  "2 Тимотей": "2 Timothy",
  Тит: "Titus",
  Филимон: "Philemon",
  Евреи: "Hebrews",
  Яков: "James",
  "1 Петър": "1 Peter",
  "2 Петър": "2 Peter",
  "1 Йоан": "1 John",
  "2 Йоан": "2 John",
  "3 Йоан": "3 John",
  Юда: "Jude",
  Откровение: "Revelation",
};
*/

// Utility functions moved to PostComponent

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
  // User and toast removed - now handled by PostComponent
  const { refreshKey } = useFeed();
  // Navigate function removed - not needed for Dashboard
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Edit-related state removed - handled by PostComponent
  const [actionError, setActionError] = useState<string | null>(null);
  // Comment input state removed - handled by PostComponent
  // Comment state removed - handled by PostComponent
  // Comment loading state removed - handled by PostComponent
  // Liking state removed - handled by PostComponent
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    postId: number | null;
    postTitle: string;
  }>({ isOpen: false, postId: null, postTitle: "" });
  const [deleting, setDeleting] = useState(false);
  // Dropdown and share modal state removed - handled by PostComponent

  // Read more/less state removed - handled by PostComponent

  // Bible verse detection and popup functions removed - handled by PostComponent

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

  // Helper functions removed - handled by PostComponent

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // Dropdown click outside handler removed - handled by PostComponent

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

  // Modal and dropdown functions removed - handled by PostComponent

  // All sharing functions removed - handled by PostComponent

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

  // PostComponent-compatible handlers
  const handlePostEdit = () => {
    // Dashboard doesn't support inline editing
  };

  const handlePostDelete = async (postId: number) => {
    await deletePost(postId);
  };

  const handlePostUpdate = () => {
    load({ silent: true }); // Silent refresh
  };

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
        <div className="db-posts-container">
          {posts.map((post) => (
            <PostComponent
              key={post.id}
              post={post}
              onEdit={handlePostEdit}
              onDelete={handlePostDelete}
              onUpdate={handlePostUpdate}
              isOwnProfile={false}
              enableInlineEdit={false}
            />
          ))}
        </div>
      )}

      {/* Bible Verse Popup removed - handled by PostComponent */}

      {/* Share Modal removed - handled by PostComponent */}

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

      {/* Bible Verse Popup removed - handled by PostComponent */}
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
