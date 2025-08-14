import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../lib/api";
import { useToast } from "../context/ToastContext";
import "../styles/BibleStudy.css";

interface BibleBook {
  name: string;
  abbreviation: string;
  chapters: number;
  testament: "old" | "new";
}

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
}

interface Bookmark {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  note?: string;
  createdAt: string;
}

interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  duration: number;
  readings: ReadingPlanDay[];
}

interface ReadingPlanDay {
  day: number;
  readings: string[];
  completed?: boolean;
}

interface Highlight {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  color: string;
  text: string;
}

const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { name: "Genesis", abbreviation: "Gen", chapters: 50, testament: "old" },
  { name: "Exodus", abbreviation: "Exo", chapters: 40, testament: "old" },
  { name: "Leviticus", abbreviation: "Lev", chapters: 27, testament: "old" },
  { name: "Numbers", abbreviation: "Num", chapters: 36, testament: "old" },
  { name: "Deuteronomy", abbreviation: "Deu", chapters: 34, testament: "old" },
  { name: "Joshua", abbreviation: "Jos", chapters: 24, testament: "old" },
  { name: "Judges", abbreviation: "Jdg", chapters: 21, testament: "old" },
  { name: "Ruth", abbreviation: "Rut", chapters: 4, testament: "old" },
  { name: "1 Samuel", abbreviation: "1Sa", chapters: 31, testament: "old" },
  { name: "2 Samuel", abbreviation: "2Sa", chapters: 24, testament: "old" },
  { name: "1 Kings", abbreviation: "1Ki", chapters: 22, testament: "old" },
  { name: "2 Kings", abbreviation: "2Ki", chapters: 25, testament: "old" },
  { name: "1 Chronicles", abbreviation: "1Ch", chapters: 29, testament: "old" },
  { name: "2 Chronicles", abbreviation: "2Ch", chapters: 36, testament: "old" },
  { name: "Ezra", abbreviation: "Ezr", chapters: 10, testament: "old" },
  { name: "Nehemiah", abbreviation: "Neh", chapters: 13, testament: "old" },
  { name: "Esther", abbreviation: "Est", chapters: 10, testament: "old" },
  { name: "Job", abbreviation: "Job", chapters: 42, testament: "old" },
  { name: "Psalms", abbreviation: "Psa", chapters: 150, testament: "old" },
  { name: "Proverbs", abbreviation: "Pro", chapters: 31, testament: "old" },
  { name: "Ecclesiastes", abbreviation: "Ecc", chapters: 12, testament: "old" },
  {
    name: "Song of Solomon",
    abbreviation: "SoS",
    chapters: 8,
    testament: "old",
  },
  { name: "Isaiah", abbreviation: "Isa", chapters: 66, testament: "old" },
  { name: "Jeremiah", abbreviation: "Jer", chapters: 52, testament: "old" },
  { name: "Lamentations", abbreviation: "Lam", chapters: 5, testament: "old" },
  { name: "Ezekiel", abbreviation: "Eze", chapters: 48, testament: "old" },
  { name: "Daniel", abbreviation: "Dan", chapters: 12, testament: "old" },
  { name: "Hosea", abbreviation: "Hos", chapters: 14, testament: "old" },
  { name: "Joel", abbreviation: "Joe", chapters: 3, testament: "old" },
  { name: "Amos", abbreviation: "Amo", chapters: 9, testament: "old" },
  { name: "Obadiah", abbreviation: "Oba", chapters: 1, testament: "old" },
  { name: "Jonah", abbreviation: "Jon", chapters: 4, testament: "old" },
  { name: "Micah", abbreviation: "Mic", chapters: 7, testament: "old" },
  { name: "Nahum", abbreviation: "Nah", chapters: 3, testament: "old" },
  { name: "Habakkuk", abbreviation: "Hab", chapters: 3, testament: "old" },
  { name: "Zephaniah", abbreviation: "Zep", chapters: 3, testament: "old" },
  { name: "Haggai", abbreviation: "Hag", chapters: 2, testament: "old" },
  { name: "Zechariah", abbreviation: "Zec", chapters: 14, testament: "old" },
  { name: "Malachi", abbreviation: "Mal", chapters: 4, testament: "old" },

  // New Testament
  { name: "Matthew", abbreviation: "Mat", chapters: 28, testament: "new" },
  { name: "Mark", abbreviation: "Mar", chapters: 16, testament: "new" },
  { name: "Luke", abbreviation: "Luk", chapters: 24, testament: "new" },
  { name: "John", abbreviation: "Joh", chapters: 21, testament: "new" },
  { name: "Acts", abbreviation: "Act", chapters: 28, testament: "new" },
  { name: "Romans", abbreviation: "Rom", chapters: 16, testament: "new" },
  {
    name: "1 Corinthians",
    abbreviation: "1Co",
    chapters: 16,
    testament: "new",
  },
  {
    name: "2 Corinthians",
    abbreviation: "2Co",
    chapters: 13,
    testament: "new",
  },
  { name: "Galatians", abbreviation: "Gal", chapters: 6, testament: "new" },
  { name: "Ephesians", abbreviation: "Eph", chapters: 6, testament: "new" },
  { name: "Philippians", abbreviation: "Phi", chapters: 4, testament: "new" },
  { name: "Colossians", abbreviation: "Col", chapters: 4, testament: "new" },
  {
    name: "1 Thessalonians",
    abbreviation: "1Th",
    chapters: 5,
    testament: "new",
  },
  {
    name: "2 Thessalonians",
    abbreviation: "2Th",
    chapters: 3,
    testament: "new",
  },
  { name: "1 Timothy", abbreviation: "1Ti", chapters: 6, testament: "new" },
  { name: "2 Timothy", abbreviation: "2Ti", chapters: 4, testament: "new" },
  { name: "Titus", abbreviation: "Tit", chapters: 3, testament: "new" },
  { name: "Philemon", abbreviation: "Phm", chapters: 1, testament: "new" },
  { name: "Hebrews", abbreviation: "Heb", chapters: 13, testament: "new" },
  { name: "James", abbreviation: "Jas", chapters: 5, testament: "new" },
  { name: "1 Peter", abbreviation: "1Pe", chapters: 5, testament: "new" },
  { name: "2 Peter", abbreviation: "2Pe", chapters: 3, testament: "new" },
  { name: "1 John", abbreviation: "1Jo", chapters: 5, testament: "new" },
  { name: "2 John", abbreviation: "2Jo", chapters: 1, testament: "new" },
  { name: "3 John", abbreviation: "3Jo", chapters: 1, testament: "new" },
  { name: "Jude", abbreviation: "Jud", chapters: 1, testament: "new" },
  { name: "Revelation", abbreviation: "Rev", chapters: 22, testament: "new" },
];

const BIBLE_VERSIONS = [
  { id: "niv", name: "New International Version", abbreviation: "NIV" },
  { id: "esv", name: "English Standard Version", abbreviation: "ESV" },
  { id: "nlt", name: "New Living Translation", abbreviation: "NLT" },
  { id: "kjv", name: "King James Version", abbreviation: "KJV" },
  { id: "nasb", name: "New American Standard Bible", abbreviation: "NASB" },
];

const READING_PLANS: ReadingPlan[] = [
  {
    id: "chronological-1year",
    name: "Chronological Bible in a Year",
    description: "Read through the Bible in chronological order over 365 days",
    duration: 365,
    readings: [], // Would be populated with actual reading plan data
  },
  {
    id: "mcheyne-1year",
    name: "M'Cheyne Reading Plan",
    description: "Classic plan reading OT once and NT/Psalms twice in a year",
    duration: 365,
    readings: [],
  },
  {
    id: "bible-90days",
    name: "Bible in 90 Days",
    description: "Read through the entire Bible in just 90 days",
    duration: 90,
    readings: [],
  },
  {
    id: "gospels-30days",
    name: "Gospels in 30 Days",
    description: "Focus on the life of Jesus through the four Gospels",
    duration: 30,
    readings: [],
  },
  {
    id: "psalms-proverbs",
    name: "Psalms & Proverbs",
    description: "Read one Psalm and one Proverb each day",
    duration: 150,
    readings: [],
  },
];

const BibleStudy: React.FC = () => {
  const { showToast } = useToast();

  // Main state
  const [activeTab, setActiveTab] = useState<
    "read" | "plans" | "bookmarks" | "search" | "discussion"
  >("read");
  const [currentBook, setCurrentBook] = useState<string>("Genesis");
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [currentVersion, setCurrentVersion] = useState<string>("niv");
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  const [searching, setSearching] = useState(false);

  // Bookmarks & Highlights
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);

  // Reading Plans
  const [activePlan, setActivePlan] = useState<ReadingPlan | null>(null);
  const [planProgress, setPlanProgress] = useState<{ [key: string]: boolean }>(
    {}
  );

  // UI state
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [activeTestament, setActiveTestament] = useState<"old" | "new">("old");
  const [noteText, setNoteText] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteVerse, setNoteVerse] = useState<{
    book: string;
    chapter: number;
    verse: number;
  } | null>(null);

  // Book search state for fullscreen modal
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [showFullscreenBookSearch, setShowFullscreenBookSearch] =
    useState(false);

  // Mobile tabs menu state
  const [showMobileTabsMenu, setShowMobileTabsMenu] = useState(false);

  // Scroll management for navigation UX
  const [showFloatingNav, setShowFloatingNav] = useState(false);
  const chapterContentRef = useRef<HTMLDivElement>(null);
  const versesContainerRef = useRef<HTMLDivElement>(null);

  // Dragging functionality for floating navigation
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 20, y: 20 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const floatingNavRef = useRef<HTMLDivElement>(null);

  // Refs for click-outside functionality
  const bookSelectorRef = useRef<HTMLDivElement>(null);
  const chapterSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChapter(currentBook, currentChapter, currentVersion);
    loadBookmarks();
    loadHighlights();
    loadReadingPlan();

    // Auto-scroll to top when chapter changes
    if (chapterContentRef.current) {
      chapterContentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentBook, currentChapter, currentVersion]);

  // Scroll effect to show/hide floating navigation
  useEffect(() => {
    const handleScroll = () => {
      if (versesContainerRef.current && chapterContentRef.current) {
        const versesContainer = versesContainerRef.current;
        const chapterContent = chapterContentRef.current;

        const versesRect = versesContainer.getBoundingClientRect();
        const chapterRect = chapterContent.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Show floating nav when:
        // 1. Chapter header is scrolled past top
        // 2. Still have verses content visible
        // 3. Not at the very bottom (bottom nav will show)
        const shouldShowFloatingNav =
          chapterRect.top < -50 &&
          versesRect.bottom > windowHeight * 0.3 &&
          versesRect.top < windowHeight * 0.7;

        setShowFloatingNav(shouldShowFloatingNav);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside effect to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Close book selector if click is outside
      if (
        showBookSelector &&
        bookSelectorRef.current &&
        !bookSelectorRef.current.contains(target)
      ) {
        setShowBookSelector(false);
      }

      // Close chapter selector if click is outside
      if (
        showChapterSelector &&
        chapterSelectorRef.current &&
        !chapterSelectorRef.current.contains(target)
      ) {
        setShowChapterSelector(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Close dropdowns on Escape key
      if (event.key === "Escape") {
        setShowBookSelector(false);
        setShowChapterSelector(false);
      }
    };

    if (showBookSelector || showChapterSelector) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showBookSelector, showChapterSelector]);

  // Drag handlers for floating navigation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!floatingNavRef.current) return;

    setIsDragging(true);
    const rect = floatingNavRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Prevent text selection while dragging
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!floatingNavRef.current) return;

    const touch = e.touches[0];
    setIsDragging(true);
    const rect = floatingNavRef.current.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });

    // Prevent scrolling while dragging
    e.preventDefault();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - 300; // Approximate width of floating nav
      const maxY = window.innerHeight - 200; // Approximate height of floating nav

      setDragPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    },
    [isDragging, dragOffset]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const newX = touch.clientX - dragOffset.x;
      const newY = touch.clientY - dragOffset.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - 300;
      const maxY = window.innerHeight - 200;

      setDragPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);

    // Save position to localStorage for persistence
    localStorage.setItem("floatingNavPosition", JSON.stringify(dragPosition));
  }, [dragPosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);

    // Save position to localStorage for persistence
    localStorage.setItem("floatingNavPosition", JSON.stringify(dragPosition));
  }, [dragPosition]);

  const resetPosition = () => {
    const defaultPosition = { x: 20, y: 20 };
    setDragPosition(defaultPosition);
    localStorage.setItem(
      "floatingNavPosition",
      JSON.stringify(defaultPosition)
    );
  };

  // Add/remove mouse and touch event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [
    isDragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // Load saved position on component mount
  useEffect(() => {
    const savedPosition = localStorage.getItem("floatingNavPosition");
    if (savedPosition) {
      try {
        const position = JSON.parse(savedPosition);
        setDragPosition(position);
      } catch (err) {
        console.error("Failed to parse saved floating nav position:", err);
      }
    }
  }, []);

  const loadChapter = async (
    book: string,
    chapter: number,
    version: string
  ) => {
    setLoading(true);
    try {
      // Fetch from backend chapter endpoint (calls public Bible API)
      type ChapterResponse = {
        verses: BibleVerse[];
        version: string;
        translation?: string;
      };
      const data = await api.get<ChapterResponse>("/bible/chapter", {
        query: { book, chapter, version },
      });
      setVerses(data.verses);

      // Mark as read in history
      await markChapterAsRead(book, chapter);
    } catch (error) {
      console.error("Failed to load chapter:", error);
      showToast({ message: "Failed to load chapter", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const markChapterAsRead = async (book: string, chapter: number) => {
    try {
      await api.post("/bible/reading-history", {
        book,
        chapter,
        dateRead: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to mark chapter as read:", error);
    }
  };

  const searchVerses = async (query: string) => {
    if (!query.trim()) return;

    setSearching(true);
    try {
      // Mock search results
      const mockResults: BibleVerse[] = [
        {
          book: "John",
          chapter: 3,
          verse: 16,
          text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
          version: currentVersion,
        },
        {
          book: "Romans",
          chapter: 8,
          verse: 28,
          text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
          version: currentVersion,
        },
      ];
      setSearchResults(mockResults);
    } catch (error) {
      console.error("Search failed:", error);
      showToast({ message: "Search failed", type: "error" });
    } finally {
      setSearching(false);
    }
  };

  const addBookmark = async (verse: BibleVerse, note?: string) => {
    try {
      // Toggle: if bookmark exists, delete it; else create
      const existing = bookmarks.find(
        (b) =>
          b.book === verse.book &&
          b.chapter === verse.chapter &&
          b.verse === verse.verse
      );
      if (existing) {
        await api.del(`/bible/bookmarks/${existing.id}`);
        setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
        showToast({ message: "Bookmark removed", type: "success" });
        return;
      }

      const bookmark = await api.post<Bookmark>("/bible/bookmarks", {
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        note,
      });
      setBookmarks((prev) => [bookmark, ...prev]);
      showToast({ message: "Verse bookmarked!", type: "success" });
    } catch (error) {
      console.error("Failed to add bookmark:", error);
      showToast({ message: "Failed to bookmark verse", type: "error" });
    }
  };

  const addHighlight = async (verse: BibleVerse, color: string) => {
    try {
      // Toggle: if highlight exists, delete it; else create
      const existing = highlights.find(
        (h) =>
          h.book === verse.book &&
          h.chapter === verse.chapter &&
          h.verse === verse.verse
      );
      if (existing) {
        await api.del(`/bible/highlights/${existing.id}`);
        setHighlights((prev) => prev.filter((h) => h.id !== existing.id));
        showToast({ message: "Highlight removed", type: "success" });
        return;
      }

      const highlight = await api.post<Highlight>("/bible/highlights", {
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        color,
      });
      setHighlights((prev) => [highlight, ...prev]);
      showToast({ message: "Verse highlighted!", type: "success" });
    } catch (error) {
      console.error("Failed to add highlight:", error);
      showToast({ message: "Failed to highlight verse", type: "error" });
    }
  };

  const loadBookmarks = async () => {
    try {
      const userBookmarks = await api.get<Bookmark[]>("/bible/bookmarks");
      setBookmarks(userBookmarks);
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
    }
  };

  const loadHighlights = async () => {
    try {
      const userHighlights = await api.get<Highlight[]>("/bible/highlights");
      setHighlights(userHighlights);
    } catch (error) {
      console.error("Failed to load highlights:", error);
    }
  };

  const loadReadingPlan = async () => {
    try {
      const plan = await api.get<{
        plan: ReadingPlan;
        progress: { [key: string]: boolean };
      }>("/bible/reading-plan");
      if (plan.plan) {
        setActivePlan(plan.plan);
        setPlanProgress(plan.progress);
      }
    } catch (error) {
      console.error("Failed to load reading plan:", error);
    }
  };

  const startReadingPlan = async (planId: string) => {
    try {
      const plan = READING_PLANS.find((p) => p.id === planId);
      if (plan) {
        await api.post("/bible/reading-plan", { planId });
        setActivePlan(plan);
        setPlanProgress({});
        showToast({ message: `Started ${plan.name}!`, type: "success" });
      }
    } catch (error) {
      console.error("Failed to start reading plan:", error);
      showToast({ message: "Failed to start reading plan", type: "error" });
    }
  };

  const getCurrentBook = () =>
    BIBLE_BOOKS.find((book) => book.name === currentBook);

  // Helper to detect mobile screens
  const isMobile = () => window.innerWidth <= 768;

  // Filter books based on search query
  const getFilteredBooks = () => {
    if (!bookSearchQuery.trim()) return BIBLE_BOOKS;
    return BIBLE_BOOKS.filter(
      (book) =>
        book.name.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
        book.abbreviation.toLowerCase().includes(bookSearchQuery.toLowerCase())
    );
  };

  // Handle book selection with mobile detection
  const handleBookClick = () => {
    if (isMobile()) {
      setShowFullscreenBookSearch(true);
      setBookSearchQuery("");
    } else {
      setShowBookSelector(!showBookSelector);
      setShowChapterSelector(false);
    }
  };

  // Handle book selection from search modal
  const selectBookFromSearch = (bookName: string) => {
    setCurrentBook(bookName);
    setCurrentChapter(1);
    setShowFullscreenBookSearch(false);
    setBookSearchQuery("");
  };
  const getVerseHighlight = (verse: BibleVerse) =>
    highlights.find(
      (h) =>
        h.book === verse.book &&
        h.chapter === verse.chapter &&
        h.verse === verse.verse
    );

  const isBookmarked = (verse: BibleVerse) =>
    bookmarks.some(
      (b) =>
        b.book === verse.book &&
        b.chapter === verse.chapter &&
        b.verse === verse.verse
    );

  const navigateToVerse = async (
    book: string,
    chapter: number,
    verseNumber: number
  ) => {
    // First navigate to the chapter
    setCurrentBook(book);
    setCurrentChapter(chapter);
    setActiveTab("read");

    // Wait for the chapter to load and DOM to update
    setTimeout(() => {
      // Find the specific verse element
      const verseElement = document.querySelector(
        `[data-verse="${verseNumber}"]`
      );
      if (verseElement) {
        // Scroll to the verse
        verseElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Highlight the verse temporarily
        const verseDiv = verseElement as HTMLElement;
        verseDiv.style.background = "rgba(37, 99, 235, 0.2)";
        verseDiv.style.boxShadow = "0 0 0 2px rgba(37, 99, 235, 0.4)";
        verseDiv.style.borderRadius = "4px";
        verseDiv.style.padding = "4px 8px";
        verseDiv.style.margin = "-4px -8px";

        // Remove highlight after 3 seconds
        setTimeout(() => {
          verseDiv.style.background = "";
          verseDiv.style.boxShadow = "";
          verseDiv.style.borderRadius = "";
          verseDiv.style.padding = "";
          verseDiv.style.margin = "";
        }, 3000);
      }
    }, 500); // Wait for chapter content to load
  };

  const removeBookmarkById = async (id: number) => {
    try {
      await api.del(`/bible/bookmarks/${id}`);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      showToast({ message: "Bookmark removed", type: "success" });
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
      showToast({ message: "Failed to remove bookmark", type: "error" });
    }
  };

  const navigateChapter = (direction: "prev" | "next") => {
    const book = getCurrentBook();
    if (!book) return;

    if (direction === "next") {
      if (currentChapter < book.chapters) {
        setCurrentChapter(currentChapter + 1);
      } else {
        // Go to next book
        const currentIndex = BIBLE_BOOKS.findIndex(
          (b) => b.name === currentBook
        );
        if (currentIndex < BIBLE_BOOKS.length - 1) {
          setCurrentBook(BIBLE_BOOKS[currentIndex + 1].name);
          setCurrentChapter(1);
        }
      }
    } else {
      if (currentChapter > 1) {
        setCurrentChapter(currentChapter - 1);
      } else {
        // Go to previous book
        const currentIndex = BIBLE_BOOKS.findIndex(
          (b) => b.name === currentBook
        );
        if (currentIndex > 0) {
          const prevBook = BIBLE_BOOKS[currentIndex - 1];
          setCurrentBook(prevBook.name);
          setCurrentChapter(prevBook.chapters);
        }
      }
    }
  };

  // Reusable navigation component
  const ChapterNavigation = ({
    className = "",
    compact = false,
  }: {
    className?: string;
    compact?: boolean;
  }) => (
    <div className={`chapter-navigation ${className}`}>
      <button
        className={`nav-btn ${compact ? "compact" : ""}`}
        onClick={() => navigateChapter("prev")}
        disabled={currentBook === "Genesis" && currentChapter === 1}
        title="Previous Chapter"
      >
        {compact ? "←" : "← Previous"}
      </button>

      <div className={`current-reference ${compact ? "compact" : ""}`}>
        <span className="book-name">{currentBook}</span>
        <span className="chapter-number">{currentChapter}</span>
      </div>

      <button
        className={`nav-btn ${compact ? "compact" : ""}`}
        onClick={() => navigateChapter("next")}
        disabled={currentBook === "Revelation" && currentChapter === 22}
        title="Next Chapter"
      >
        {compact ? "→" : "Next →"}
      </button>

      {compact && (
        <button
          className="scroll-to-top-btn"
          onClick={() =>
            chapterContentRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          title="Scroll to Top"
        >
          ↑
        </button>
      )}
    </div>
  );

  return (
    <div className="bible-study-container">
      {/* Floating Navigation */}
      {showFloatingNav && activeTab === "read" && (
        <div
          ref={floatingNavRef}
          className={`floating-navigation ${isDragging ? "dragging" : ""}`}
          style={{
            position: "fixed",
            left: `${dragPosition.x}px`,
            top: `${dragPosition.y}px`,
            cursor: isDragging ? "grabbing" : "grab",
            zIndex: 1001,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={resetPosition}
          title="Drag to move, double-click to reset position"
        >
          <div className="drag-handle" title="Drag to reposition">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="5" r="1" />
              <circle cx="15" cy="5" r="1" />
              <circle cx="9" cy="12" r="1" />
              <circle cx="15" cy="12" r="1" />
              <circle cx="9" cy="19" r="1" />
              <circle cx="15" cy="19" r="1" />
            </svg>
          </div>
          <ChapterNavigation className="floating-nav-content" compact={true} />
        </div>
      )}

      {/* Header */}
      <div className="bible-header">
        <div className="bible-title">
          <h1>📖 Bible Study</h1>
          <p>Study God's Word with modern tools</p>
        </div>

        <div className="bible-nav-tabs">
          <button
            className={`tab-btn ${activeTab === "read" ? "active" : ""}`}
            onClick={() => setActiveTab("read")}
          >
            📚 Read
          </button>
          <button
            className={`tab-btn ${activeTab === "plans" ? "active" : ""}`}
            onClick={() => setActiveTab("plans")}
          >
            📅 Plans
          </button>
          <button
            className={`tab-btn ${activeTab === "bookmarks" ? "active" : ""}`}
            onClick={() => setActiveTab("bookmarks")}
          >
            🔖 Bookmarks
          </button>
          <button
            className={`tab-btn ${activeTab === "search" ? "active" : ""}`}
            onClick={() => setActiveTab("search")}
          >
            🔍 Search
          </button>
          <button
            className={`tab-btn ${activeTab === "discussion" ? "active" : ""}`}
            onClick={() => setActiveTab("discussion")}
          >
            💬 Discussion
          </button>
        </div>

        {/* Mobile 3-dot menu */}
        <div className="mobile-tabs-menu">
          <button
            className="mobile-menu-trigger"
            onClick={() => setShowMobileTabsMenu(!showMobileTabsMenu)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {showMobileTabsMenu && (
            <div className="mobile-menu-dropdown">
              <button
                className={`mobile-tab-item ${
                  activeTab === "read" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("read");
                  setShowMobileTabsMenu(false);
                }}
              >
                📚 Read
              </button>
              <button
                className={`mobile-tab-item ${
                  activeTab === "plans" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("plans");
                  setShowMobileTabsMenu(false);
                }}
              >
                📅 Plans
              </button>
              <button
                className={`mobile-tab-item ${
                  activeTab === "bookmarks" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("bookmarks");
                  setShowMobileTabsMenu(false);
                }}
              >
                🔖 Bookmarks
              </button>
              <button
                className={`mobile-tab-item ${
                  activeTab === "search" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("search");
                  setShowMobileTabsMenu(false);
                }}
              >
                🔍 Search
              </button>
              <button
                className={`mobile-tab-item ${
                  activeTab === "discussion" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("discussion");
                  setShowMobileTabsMenu(false);
                }}
              >
                💬 Discussion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reading Tab */}
      {activeTab === "read" && (
        <div className="bible-content">
          {/* Enhanced Navigation Controls */}
          <div className="enhanced-navigation">
            {/* Primary Navigation Bar */}
            <div className="nav-primary">
              <div className="nav-location">
                <div className="current-reference">
                  <span className="book-name">{currentBook}</span>
                  <span className="chapter-number">{currentChapter}</span>
                </div>
                <div className="nav-arrows">
                  <button
                    className="nav-arrow prev"
                    onClick={() => navigateChapter("prev")}
                    disabled={currentBook === "Genesis" && currentChapter === 1}
                    title="Previous Chapter"
                  >
                    ←
                  </button>
                  <button
                    className="nav-arrow next"
                    onClick={() => navigateChapter("next")}
                    disabled={
                      currentBook === "Revelation" && currentChapter === 22
                    }
                    title="Next Chapter"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="nav-selectors">
                <button
                  className="nav-selector book-selector"
                  onClick={handleBookClick}
                >
                  <span>📖</span>
                  <span>Books</span>
                </button>
                <button
                  className="nav-selector chapter-selector"
                  onClick={() => {
                    setShowChapterSelector(!showChapterSelector);
                    setShowBookSelector(false);
                  }}
                >
                  <span>📄</span>
                  <span>Chapters</span>
                </button>
                <select
                  className="version-select"
                  value={currentVersion}
                  onChange={(e) => setCurrentVersion(e.target.value)}
                >
                  {BIBLE_VERSIONS.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.abbreviation}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Chapter Navigation */}
            <div className="chapter-quick-nav">
              <div className="chapter-range">
                {Array.from(
                  { length: Math.min(getCurrentBook()?.chapters || 1, 10) },
                  (_, i) => {
                    const chapterNum = Math.max(1, currentChapter - 5) + i;
                    const maxChapter = getCurrentBook()?.chapters || 1;
                    if (chapterNum > maxChapter) return null;

                    return (
                      <button
                        key={chapterNum}
                        className={`quick-chapter ${
                          currentChapter === chapterNum ? "active" : ""
                        }`}
                        onClick={() => setCurrentChapter(chapterNum)}
                      >
                        {chapterNum}
                      </button>
                    );
                  }
                ).filter(Boolean)}
                {(getCurrentBook()?.chapters || 1) > 10 && (
                  <button
                    className="more-chapters"
                    onClick={() => setShowChapterSelector(true)}
                  >
                    ...
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Book Selector */}
            {showBookSelector && (
              <div className="enhanced-book-selector" ref={bookSelectorRef}>
                <div className="book-selector-header">
                  <h3>Select a Book</h3>
                  <button
                    className="close-selector"
                    onClick={() => setShowBookSelector(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="testament-tabs">
                  <button
                    className={`testament-tab ${
                      activeTestament === "old" ? "active" : ""
                    }`}
                    onClick={() => setActiveTestament("old")}
                  >
                    Old Testament (39)
                  </button>
                  <button
                    className={`testament-tab ${
                      activeTestament === "new" ? "active" : ""
                    }`}
                    onClick={() => setActiveTestament("new")}
                  >
                    New Testament (27)
                  </button>
                </div>

                <div className="books-list">
                  {BIBLE_BOOKS.filter(
                    (book) => book.testament === activeTestament
                  ).map((book) => (
                    <button
                      key={book.name}
                      className={`book-item ${
                        currentBook === book.name ? "active" : ""
                      }`}
                      onClick={() => {
                        setCurrentBook(book.name);
                        setCurrentChapter(1);
                        setShowBookSelector(false);
                      }}
                    >
                      <span className="book-name">{book.name}</span>
                      <span className="book-info">
                        {book.chapters} chapters
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Chapter Selector */}
            {showChapterSelector && (
              <div
                className="enhanced-chapter-selector"
                ref={chapterSelectorRef}
              >
                <div className="chapter-selector-header">
                  <h3>{currentBook} - Select Chapter</h3>
                  <button
                    className="close-selector"
                    onClick={() => setShowChapterSelector(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="chapters-grid">
                  {Array.from(
                    { length: getCurrentBook()?.chapters || 1 },
                    (_, i) => (
                      <button
                        key={i + 1}
                        className={`chapter-item ${
                          currentChapter === i + 1 ? "active" : ""
                        }`}
                        onClick={() => {
                          setCurrentChapter(i + 1);
                          setShowChapterSelector(false);
                        }}
                      >
                        {i + 1}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chapter Content */}
          <div className="chapter-content" ref={chapterContentRef}>
            <div className="chapter-header">
              <h2>
                {currentBook} {currentChapter}
              </h2>
              <div className="chapter-meta">
                <span className="version-indicator">
                  {
                    BIBLE_VERSIONS.find((v) => v.id === currentVersion)
                      ?.abbreviation
                  }
                </span>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading chapter...</p>
              </div>
            ) : (
              <div className="verses-container" ref={versesContainerRef}>
                {verses.length === 0 && !loading && (
                  <div className="no-verses">
                    No verses found. Click navigation to load chapter.
                  </div>
                )}
                {verses.map((verse) => {
                  const highlight = getVerseHighlight(verse);
                  return (
                    <div
                      key={verse.verse}
                      data-verse={verse.verse}
                      className={`verse ${highlight ? "highlighted" : ""} ${
                        selectedVerses.includes(verse.verse) ? "selected" : ""
                      }`}
                      style={
                        highlight
                          ? { backgroundColor: highlight.color + "30" }
                          : {}
                      }
                      onClick={() => {
                        if (selectedVerses.includes(verse.verse)) {
                          setSelectedVerses((prev) =>
                            prev.filter((v) => v !== verse.verse)
                          );
                        } else {
                          setSelectedVerses((prev) => [...prev, verse.verse]);
                        }
                      }}
                    >
                      <span className="verse-number">{verse.verse}</span>
                      <span className="verse-text">{verse.text}</span>
                      <div className="verse-actions">
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addBookmark(verse);
                          }}
                          title={
                            isBookmarked(verse)
                              ? "Remove bookmark"
                              : "Bookmark verse"
                          }
                        >
                          {isBookmarked(verse) ? "✔️" : "🔖"}
                        </button>
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addHighlight(verse, "#ffeb3b");
                          }}
                          title={
                            getVerseHighlight(verse)
                              ? "Remove highlight"
                              : "Highlight verse"
                          }
                        >
                          {getVerseHighlight(verse) ? "🗑️" : "✨"}
                        </button>
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteVerse({
                              book: verse.book,
                              chapter: verse.chapter,
                              verse: verse.verse,
                            });
                            setShowNoteModal(true);
                          }}
                          title="Add note"
                        >
                          📝
                        </button>
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(
                              `${verse.book} ${verse.chapter}:${verse.verse} - ${verse.text}`
                            );
                            showToast({
                              message: "Verse copied to clipboard!",
                              type: "success",
                            });
                          }}
                          title="Copy verse"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Navigation */}
            {verses.length > 0 && (
              <div className="bottom-navigation">
                <ChapterNavigation className="bottom-nav-content" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reading Plans Tab */}
      {activeTab === "plans" && (
        <div className="bible-content">
          <div className="plans-section">
            <h3>📅 Reading Plans</h3>

            {activePlan ? (
              <div className="active-plan">
                <div className="plan-header">
                  <h4>Current Plan: {activePlan.name}</h4>
                  <p>{activePlan.description}</p>
                  <div className="plan-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${
                            (Object.keys(planProgress).filter(
                              (key) => planProgress[key]
                            ).length /
                              activePlan.duration) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {
                        Object.keys(planProgress).filter(
                          (key) => planProgress[key]
                        ).length
                      }{" "}
                      / {activePlan.duration} days
                    </span>
                  </div>
                </div>

                <div className="todays-reading">
                  <h5>Today's Reading</h5>
                  <div className="reading-assignments">
                    <div className="reading-item">
                      <span className="reading-text">Genesis 1-3</span>
                      <button className="reading-btn">Read Now</button>
                    </div>
                    <div className="reading-item">
                      <span className="reading-text">Matthew 1</span>
                      <button className="reading-btn">Read Now</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="available-plans">
                <h4>Choose a Reading Plan</h4>
                <div className="plans-grid">
                  {READING_PLANS.map((plan) => (
                    <div key={plan.id} className="plan-card">
                      <h5>{plan.name}</h5>
                      <p>{plan.description}</p>
                      <div className="plan-duration">{plan.duration} days</div>
                      <button
                        className="plan-start-btn"
                        onClick={() => startReadingPlan(plan.id)}
                      >
                        Start Plan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bookmarks Tab */}
      {activeTab === "bookmarks" && (
        <div className="bible-content">
          <div className="bookmarks-section">
            <h3>🔖 Your Bookmarks</h3>

            {bookmarks.length > 0 ? (
              <div className="bookmarks-list">
                {bookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="bookmark-item">
                    <div className="bookmark-reference">
                      <strong>
                        {bookmark.book} {bookmark.chapter}:{bookmark.verse}
                      </strong>
                    </div>
                    <div className="bookmark-text">{bookmark.text}</div>
                    {bookmark.note && (
                      <div className="bookmark-note">
                        <strong>Note:</strong> {bookmark.note}
                      </div>
                    )}
                    <div className="bookmark-date">
                      Saved {new Date(bookmark.createdAt).toLocaleDateString()}
                    </div>
                    <div className="bookmark-actions">
                      <button
                        className="bookmark-go-btn"
                        onClick={() => {
                          navigateToVerse(
                            bookmark.book,
                            bookmark.chapter,
                            bookmark.verse
                          );
                        }}
                      >
                        Go to verse
                      </button>
                      <button
                        className="bookmark-remove-btn"
                        onClick={() => removeBookmarkById(bookmark.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔖</div>
                <h4>No bookmarks yet</h4>
                <p>Start reading and bookmark your favorite verses!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Tab */}
      {activeTab === "search" && (
        <div className="bible-content">
          <div className="search-section">
            <h3>🔍 Search Scripture</h3>

            <div className="search-controls">
              <div className="search-input-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search for verses, keywords, or references..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && searchVerses(searchQuery)
                  }
                />
                <button
                  className="search-btn"
                  onClick={() => searchVerses(searchQuery)}
                  disabled={searching || !searchQuery.trim()}
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>

              <div className="search-filters">
                <select className="filter-select">
                  <option value="all">All Books</option>
                  <option value="old">Old Testament</option>
                  <option value="new">New Testament</option>
                </select>
                <select
                  className="filter-select"
                  value={currentVersion}
                  onChange={(e) => setCurrentVersion(e.target.value)}
                >
                  {BIBLE_VERSIONS.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.abbreviation}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                <h4>Search Results ({searchResults.length})</h4>
                <div className="results-list">
                  {searchResults.map((result, index) => (
                    <div key={index} className="search-result-item">
                      <div className="result-reference">
                        <strong>
                          {result.book} {result.chapter}:{result.verse}
                        </strong>
                      </div>
                      <div className="result-text">{result.text}</div>
                      <div className="result-actions">
                        <button
                          className="result-go-btn"
                          onClick={() => {
                            setCurrentBook(result.book);
                            setCurrentChapter(result.chapter);
                            setActiveTab("read");
                          }}
                        >
                          Go to verse
                        </button>
                        <button
                          className="result-bookmark-btn"
                          onClick={() => addBookmark(result)}
                        >
                          🔖 Bookmark
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discussion Tab */}
      {activeTab === "discussion" && (
        <div className="bible-content">
          <div className="discussion-section">
            <h3>💬 Bible Discussion</h3>

            <div className="discussion-topics">
              <div className="topic-item">
                <div className="topic-header">
                  <h4>Daily Devotions & Reflections</h4>
                  <span className="topic-count">12 discussions</span>
                </div>
                <p>Share your daily devotions and insights from God's Word</p>
                <div className="topic-meta">
                  <span>Last post: 2 hours ago by John D.</span>
                </div>
              </div>

              <div className="topic-item">
                <div className="topic-header">
                  <h4>Prayer Requests</h4>
                  <span className="topic-count">8 requests</span>
                </div>
                <p>Share prayer requests and pray for one another</p>
                <div className="topic-meta">
                  <span>Last post: 1 hour ago by Sarah M.</span>
                </div>
              </div>

              <div className="topic-item">
                <div className="topic-header">
                  <h4>Bible Study Questions</h4>
                  <span className="topic-count">15 discussions</span>
                </div>
                <p>Ask questions and discuss difficult passages together</p>
                <div className="topic-meta">
                  <span>Last post: 30 minutes ago by Michael R.</span>
                </div>
              </div>
            </div>

            <button className="new-discussion-btn">
              💬 Start New Discussion
            </button>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && noteVerse && (
        <div className="note-modal-overlay">
          <div className="note-modal">
            <div className="note-modal-header">
              <h4>Add Note</h4>
              <span className="note-reference">
                {noteVerse.book} {noteVerse.chapter}:{noteVerse.verse}
              </span>
            </div>
            <div className="note-modal-body">
              <textarea
                className="note-textarea"
                placeholder="Add your personal note or reflection..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
              />
            </div>
            <div className="note-modal-actions">
              <button
                className="note-cancel-btn"
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText("");
                  setNoteVerse(null);
                }}
              >
                Cancel
              </button>
              <button
                className="note-save-btn"
                onClick={async () => {
                  if (noteVerse) {
                    const verse = verses.find(
                      (v) =>
                        v.book === noteVerse.book &&
                        v.chapter === noteVerse.chapter &&
                        v.verse === noteVerse.verse
                    );
                    if (verse) {
                      await addBookmark(verse, noteText);
                    }
                  }
                  setShowNoteModal(false);
                  setNoteText("");
                  setNoteVerse(null);
                }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Book Search Modal */}
      {showFullscreenBookSearch && (
        <div className="fullscreen-book-search">
          <div className="book-search-header">
            <div className="search-container">
              <div className="search-input-wrapper">
                <svg
                  className="search-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="M21 21l-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search for books (e.g., Genesis, Romans, Psalms...)"
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  className="book-search-input"
                  autoFocus
                />
                {bookSearchQuery && (
                  <button
                    className="clear-search-btn"
                    onClick={() => setBookSearchQuery("")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <button
              className="close-book-search-btn"
              onClick={() => {
                setShowFullscreenBookSearch(false);
                setBookSearchQuery("");
              }}
            >
              <svg
                width="24"
                height="24"
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

          <div className="book-search-content">
            {!bookSearchQuery.trim() && (
              <div className="search-suggestions">
                <div className="suggestion-section">
                  <h3>📖 Old Testament</h3>
                  <div className="suggestion-books">
                    {BIBLE_BOOKS.filter((book) => book.testament === "old")
                      .slice(0, 8)
                      .map((book) => (
                        <button
                          key={book.name}
                          className="suggestion-book"
                          onClick={() => selectBookFromSearch(book.name)}
                        >
                          <span className="book-name">{book.name}</span>
                          <span className="book-chapters">
                            {book.chapters} chapters
                          </span>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="suggestion-section">
                  <h3>✝️ New Testament</h3>
                  <div className="suggestion-books">
                    {BIBLE_BOOKS.filter((book) => book.testament === "new")
                      .slice(0, 8)
                      .map((book) => (
                        <button
                          key={book.name}
                          className="suggestion-book"
                          onClick={() => selectBookFromSearch(book.name)}
                        >
                          <span className="book-name">{book.name}</span>
                          <span className="book-chapters">
                            {book.chapters} chapters
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {bookSearchQuery.trim() && (
              <div className="search-results">
                <div className="results-header">
                  <h3>📚 Search Results</h3>
                  <span className="results-count">
                    {getFilteredBooks().length} book
                    {getFilteredBooks().length !== 1 ? "s" : ""} found
                  </span>
                </div>

                <div className="results-list">
                  {getFilteredBooks().length > 0 ? (
                    getFilteredBooks().map((book) => (
                      <button
                        key={book.name}
                        className="result-book"
                        onClick={() => selectBookFromSearch(book.name)}
                      >
                        <div className="book-info">
                          <span className="book-name">{book.name}</span>
                          <span className="book-details">
                            {book.abbreviation} • {book.chapters} chapters •{" "}
                            {book.testament === "old"
                              ? "Old Testament"
                              : "New Testament"}
                          </span>
                        </div>
                        <div className="book-arrow">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="9,18 15,12 9,6"></polyline>
                          </svg>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="no-results">
                      <div className="no-results-icon">📖</div>
                      <h4>No books found</h4>
                      <p>
                        Try searching for a different book name or abbreviation.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleStudy;
