import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";

// Bible books list for verse detection
const BIBLE_BOOKS = [
  // Old Testament
  { name: "Genesis", abbreviations: ["Gen", "Ge", "Gn"] },
  { name: "Exodus", abbreviations: ["Exo", "Ex", "Exod"] },
  { name: "Leviticus", abbreviations: ["Lev", "Le", "Lv"] },
  { name: "Numbers", abbreviations: ["Num", "Nu", "Nm"] },
  { name: "Deuteronomy", abbreviations: ["Deu", "Dt", "De"] },
  { name: "Joshua", abbreviations: ["Jos", "Jsh"] },
  { name: "Judges", abbreviations: ["Jdg", "Jg", "Jgs"] },
  { name: "Ruth", abbreviations: ["Rut", "Ru"] },
  { name: "1 Samuel", abbreviations: ["1Sa", "1 Sam", "1S"] },
  { name: "2 Samuel", abbreviations: ["2Sa", "2 Sam", "2S"] },
  { name: "1 Kings", abbreviations: ["1Ki", "1 Kgs", "1K"] },
  { name: "2 Kings", abbreviations: ["2Ki", "2 Kgs", "2K"] },
  { name: "1 Chronicles", abbreviations: ["1Ch", "1 Chr", "1Chron"] },
  { name: "2 Chronicles", abbreviations: ["2Ch", "2 Chr", "2Chron"] },
  { name: "Ezra", abbreviations: ["Ezr", "Ez"] },
  { name: "Nehemiah", abbreviations: ["Neh", "Ne"] },
  { name: "Esther", abbreviations: ["Est", "Es"] },
  { name: "Job", abbreviations: ["Job", "Jb"] },
  { name: "Psalms", abbreviations: ["Psa", "Ps", "Psalm"] },
  { name: "Proverbs", abbreviations: ["Pro", "Pr", "Prov"] },
  { name: "Ecclesiastes", abbreviations: ["Ecc", "Ec", "Eccl"] },
  { name: "Song of Solomon", abbreviations: ["Son", "So", "SOS", "Song"] },
  { name: "Isaiah", abbreviations: ["Isa", "Is"] },
  { name: "Jeremiah", abbreviations: ["Jer", "Je"] },
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
  // New Testament
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

// Bulgarian -> English book name mapping (full names and common synonyms)
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

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  // Add support for multiple verses
  verses?: Array<{
    book: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
}

interface VerseReference {
  book: string;
  chapter: number;
  verse?: number;
  endVerse?: number;
  originalText: string;
  startIndex: number;
  endIndex: number;
  // optional version hint (e.g., 'vbg' for Bulgarian)
  version?: string;
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

// Bible verse detection function
function detectBibleVerses(text: string): VerseReference[] {
  const verses: VerseReference[] = [];

  // Create a simple pattern that looks for book names followed by chapter:verse
  BIBLE_BOOKS.forEach((book) => {
    const allNames = [book.name, ...book.abbreviations];

    allNames.forEach((bookName) => {
      // Create pattern for each book name/abbreviation
      // More flexible pattern that handles various scenarios
      const pattern = new RegExp(
        `(${bookName.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )})\\s+(\\d+):(\\d+)(?:-(\\d+))?`,
        "gi"
      );

      let match;
      let attempts = 0;
      while ((match = pattern.exec(text)) !== null && attempts < 10) {
        attempts++;

        const chapter = parseInt(match[2]);
        const verse = parseInt(match[3]);
        const endVerse = match[4] ? parseInt(match[4]) : undefined;

        verses.push({
          book: book.name,
          chapter,
          verse,
          endVerse,
          originalText: match[0],
          startIndex: match.index || 0,
          endIndex: (match.index || 0) + match[0].length,
        });
      }
    });
  });

  // Bulgarian book detection (full names and common short forms)
  Object.keys(BG_BOOK_MAP).forEach((bgName) => {
    const escaped = bgName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(${escaped})\\s+(\\d+):(\\d+)(?:-(\\d+))?`,
      "gi"
    );

    let match;
    let attempts = 0;
    while ((match = pattern.exec(text)) !== null && attempts < 10) {
      attempts++;
      const chapter = parseInt(match[2]);
      const verse = parseInt(match[3]);
      const endVerse = match[4] ? parseInt(match[4]) : undefined;

      verses.push({
        book: BG_BOOK_MAP[bgName], // canonical English for backend API
        chapter,
        verse,
        endVerse,
        originalText: match[0],
        startIndex: match.index || 0,
        endIndex: (match.index || 0) + match[0].length,
        version: "vbg", // hint to fetch Bulgarian text
      });
    }
  });

  // Remove duplicates and sort by position
  const uniqueVerses = verses
    .filter(
      (verse, index, arr) =>
        arr.findIndex((v) => v.startIndex === verse.startIndex) === index
    )
    .sort((a, b) => a.startIndex - b.startIndex);

  return uniqueVerses;
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

  // Bible verse popup state
  const [showVersePopup, setShowVersePopup] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<VerseReference | null>(
    null
  );
  const [verseData, setVerseData] = useState<BibleVerse | null>(null);
  const [loadingVerse, setLoadingVerse] = useState(false);
  const versePopupRef = useRef<HTMLDivElement>(null);

  // Read more/less state
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Check if text should be truncated
  useEffect(() => {
    if (textRef.current) {
      const lineHeight = parseInt(getComputedStyle(textRef.current).lineHeight);
      const maxHeight = lineHeight * 3.6; // About 3.6 lines
      setShouldShowReadMore(textRef.current.scrollHeight > maxHeight);
    }
  }, [post.content]);

  // Click outside effect to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false);
      }
      if (
        versePopupRef.current &&
        !versePopupRef.current.contains(event.target as Node)
      ) {
        setShowVersePopup(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(false);
        setShowVersePopup(false);
      }
    };

    if (openDropdown || showVersePopup) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown, showVersePopup]);

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

  // Function to render content with highlighted Bible verses
  const renderContentWithVerses = (content: string) => {
    const verses = detectBibleVerses(content);

    if (verses.length === 0) {
      return content;
    }

    const parts = [];
    let lastIndex = 0;

    verses.forEach((verse, index) => {
      // Add text before this verse
      if (verse.startIndex > lastIndex) {
        parts.push(content.slice(lastIndex, verse.startIndex));
      }

      // Add the clickable verse reference
      parts.push(
        <span
          key={`verse-${index}`}
          className="bible-verse-reference"
          onClick={() => handleVerseClick(verse)}
          title={`Click to view ${verse.originalText}`}
        >
          {verse.originalText}
        </span>
      );

      lastIndex = verse.endIndex;
    });

    // Add remaining text after last verse
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts;
  };

  // Bible verse handling functions
  const handleVerseClick = async (verse: VerseReference) => {
    setSelectedVerse(verse);
    setShowVersePopup(true);
    setLoadingVerse(true);

    try {
      // Fetch verse data from API
      const response = await api.get<{
        reference: string;
        verses: Array<{
          book: string;
          chapter: number;
          verse: number;
          text: string;
          version: string;
        }>;
        version: string;
      }>(
        `/bible/verse?book=${encodeURIComponent(verse.book)}&chapter=${
          verse.chapter
        }&verse=${verse.verse}${
          verse.endVerse ? `&endVerse=${verse.endVerse}` : ""
        }${
          verse.version ? `&version=${encodeURIComponent(verse.version)}` : ""
        }`
      );

      // Extract verses from the response
      if (response.verses && response.verses.length > 0) {
        if (response.verses.length === 1) {
          // Single verse
          const firstVerse = response.verses[0];
          setVerseData({
            book: firstVerse.book,
            chapter: firstVerse.chapter,
            verse: firstVerse.verse,
            text: firstVerse.text,
          });
        } else {
          // Multiple verses (verse range)
          const firstVerse = response.verses[0];
          setVerseData({
            book: firstVerse.book,
            chapter: firstVerse.chapter,
            verse: firstVerse.verse,
            text: response.verses
              .map((v) => `${v.verse} ${v.text}`)
              .join("\n\n"),
            verses: response.verses, // Store all verses for reference
          });
        }
      } else {
        throw new Error("No verses found in response");
      }
    } catch (error) {
      console.error("Failed to fetch verse:", error);
      showToast({ message: "Failed to load verse", type: "error" });
    } finally {
      setLoadingVerse(false);
    }
  };

  const closeVersePopup = () => {
    setShowVersePopup(false);
    setSelectedVerse(null);
    setVerseData(null);
  };

  const bookmarkVerse = async () => {
    if (!verseData) return;

    try {
      await api.post("/bible/bookmarks", {
        book: verseData.book,
        chapter: verseData.chapter,
        verse: verseData.verse,
        text: verseData.text,
      });
      showToast({ message: "Verse bookmarked!", type: "success" });
      closeVersePopup();
    } catch (error: any) {
      console.error("Failed to bookmark verse:", error);

      // Handle already bookmarked case
      if (error.message === "Verse already bookmarked") {
        showToast({
          message: "This verse is already bookmarked!",
          type: "warning",
        });
      } else {
        showToast({ message: "Failed to bookmark verse", type: "error" });
      }
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
          <p
            ref={textRef}
            className={`db-post-body ${
              !isExpanded && shouldShowReadMore ? "db-post-body-collapsed" : ""
            }`}
          >
            {renderContentWithVerses(post.content)}
          </p>
          {shouldShowReadMore && (
            <button
              className="db-read-more"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Read less" : "Read more"}
            </button>
          )}
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

      {/* Bible Verse Popup */}
      {showVersePopup && selectedVerse && (
        <div className="verse-popup-overlay">
          <div className="verse-popup" ref={versePopupRef}>
            <div className="verse-popup-header">
              <h4>
                {selectedVerse.book} {selectedVerse.chapter}:
                {selectedVerse.verse}
                {selectedVerse.endVerse &&
                selectedVerse.endVerse !== selectedVerse.verse
                  ? `-${selectedVerse.endVerse}`
                  : ""}
              </h4>
              <button className="verse-popup-close" onClick={closeVersePopup}>
                ×
              </button>
            </div>

            <div className="verse-popup-content">
              {loadingVerse ? (
                <div className="verse-loading">Loading verse...</div>
              ) : verseData ? (
                <div className="verse-text">
                  {verseData.verses && verseData.verses.length > 1 ? (
                    // Multiple verses - format each verse separately
                    <div>
                      {verseData.verses.map((v, index) => (
                        <div key={index} style={{ marginBottom: "12px" }}>
                          <strong>{v.verse}</strong> {v.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Single verse
                    <p>"{verseData.text}"</p>
                  )}
                  <span className="verse-reference">
                    — {verseData.book} {verseData.chapter}:
                    {verseData.verses && verseData.verses.length > 1
                      ? `${verseData.verses[0].verse}-${
                          verseData.verses[verseData.verses.length - 1].verse
                        }`
                      : verseData.verse}
                  </span>
                </div>
              ) : (
                <div className="verse-error">Failed to load verse</div>
              )}
            </div>

            {verseData && (
              <div className="verse-popup-actions">
                <button className="verse-bookmark-btn" onClick={bookmarkVerse}>
                  🔖 Bookmark
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export default PostComponent;
