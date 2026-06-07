"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Script from "next/script";
import { z } from "zod";
import { 
  MagnifyingGlass, 
  ArrowClockwise, 
  GithubLogo, 
  RedditLogo, 
  XLogo, 
  FacebookLogo, 
  InstagramLogo,
  LinkedinLogo,
  MediumLogo,
  Globe, 
  BookOpen, 
  Database,
  Lightning,
  Sun,
  Moon,
  X,
  Plus,
  CaretUp,
  Spinner
} from "@phosphor-icons/react";
import DirectoryCard from "../components/DirectoryCard";
import StarBorder from "../components/StarBorder";
import ClickSpark from "../components/ClickSpark";
import fallbackData from "../public/launchdb-fallback.json";

interface DirectoryItem {
  id: number;
  name: string;
  description: string;
  submission_link: string;
}

// URL regex with negative lookahead to prevent matching www as domain without secondary dot
const urlRegex = /^https?:\/\/(?:www\.)?(?!www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/i;

const submitDirectorySchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Directory name is required")
    .max(30, "Directory name must be 30 characters or less"),
  description: z.string()
    .trim()
    .min(1, "Description is required")
    .max(140, "Description must be 140 characters or less"),
  link: z.string()
    .trim()
    .min(1, "Submission link is required")
    .superRefine((val, ctx) => {
      const trimmed = val.trim();
      const lower = trimmed.toLowerCase();
      if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "URL must start with http:// or https://"
        });
        return;
      }
      if (!urlRegex.test(trimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid URL format (e.g. https://example.com)"
        });
      }
    }),
  platform: z.enum(["web", "reddit", "x", "facebook", "github"], {
    message: "Invalid platform selected",
  }),
  turnstileToken: z.string().min(1, "Please complete the security check"),
});

export default function Home() {
  const [allData, setAllData] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(24);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isForceMobile, setIsForceMobile] = useState(false);
  const desktopMinWidthRef = useRef<number>(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Back to Top visibility controller
  useEffect(() => {
    let active = true;
    const handleScroll = () => {
      if (!active) return;
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      active = false;
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // IntersectionObserver to detect when the controls wrapper becomes sticky
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      {
        threshold: [0],
        rootMargin: "-1px 0px 0px 0px", // triggers exactly when sentinel scrolls out of view at top of viewport
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.unobserve(sentinel);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Dynamic count formatting
  const formattedCount = useMemo(() => {
    const count = allData.length > 0 ? allData.length : fallbackData.length;
    if (count < 50) return `${count}`;
    return `${Math.floor(count / 50) * 50}+`;
  }, [allData]);

  // Submit Directory Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newDirName, setNewDirName] = useState("");
  const [newDirDesc, setNewDirDesc] = useState("");
  const [newDirLink, setNewDirLink] = useState("");
  const [newDirPlatform, setNewDirPlatform] = useState<"web" | "reddit" | "x" | "facebook" | "github">("web");
  const [isPlatformManuallySelected, setIsPlatformManuallySelected] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; description?: string; link?: string; turnstile?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isTurnstileLoading, setIsTurnstileLoading] = useState(true);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean | null; message: string }>({
    success: null,
    message: "",
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Sync theme with document attribute on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      const currentTheme = document.documentElement.getAttribute("data-theme") as "light" | "dark" || "dark";
      setTheme(currentTheme);
    }

    // Check search params for ?submit flag
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("submit")) {
        setIsSubmitModalOpen(true);
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  // Fetch data on mount
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        // Try fetching live data from github
        const res = await fetch(
          "https://raw.githubusercontent.com/theshubh77/awesome-saas-directories/master/launchdb.json"
        );
        if (!res.ok) throw new Error("Failed to fetch live repo data");
        const json = await res.json();
        if (active) {
          setAllData(json);
          setFetchError(false);
        }
      } catch (err) {
        console.warn("Live fetch failed, trying local fallback...", err);
        // Fallback to local copy
        try {
          const resFallback = await fetch("/launchdb-fallback.json");
          if (!resFallback.ok) throw new Error("Fallback file fetch failed");
          const jsonFallback = await resFallback.json();
          if (active) {
            setAllData(jsonFallback);
            setFetchError(true);
          }
        } catch (fallbackErr) {
          console.error("Critical: Fallback data failed to load", fallbackErr);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  // Platform classifier helper for counts
  const getPlatformType = (name: string, link: string): string => {
    const nameLower = name.toLowerCase();
    const linkLower = link.toLowerCase();

    if (nameLower.startsWith("r/") || linkLower.includes("reddit.com")) return "reddit";
    if (nameLower.startsWith("x/") || linkLower.includes("x.com") || linkLower.includes("twitter.com")) return "x";
    if (nameLower.startsWith("fb/") || linkLower.includes("facebook.com")) return "facebook";
    if (nameLower.startsWith("gh/") || linkLower.includes("github.com")) return "github";
    return "web";
  };

  // Filter lists based on state
  const filteredData = useMemo(() => {
    return allData.filter((item) => {
      const matchSearch = 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.description.toLowerCase().includes(search.toLowerCase());
      
      if (!matchSearch) return false;
      if (platformFilter === "all") return true;
      
      const itemPlatform = getPlatformType(item.name, item.submission_link);
      return itemPlatform === platformFilter;
    });
  }, [allData, search, platformFilter]);

  // Reset items count when filter changes
  useEffect(() => {
    setVisibleCount(24);
  }, [search, platformFilter]);

  // Auto-detect platform from submission link
  const detectPlatformFromLink = (link: string): "web" | "reddit" | "x" | "facebook" | "github" => {
    const linkLower = link.trim().toLowerCase();
    if (!linkLower) return "web";
    
    if (linkLower.includes("reddit.com")) return "reddit";
    if (linkLower.includes("x.com") || linkLower.includes("twitter.com")) return "x";
    if (linkLower.includes("facebook.com")) return "facebook";
    if (linkLower.includes("github.com")) return "github";
    
    return "web";
  };

  // Handle link change with auto platform detection and real-time URL validation
  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewDirLink(value);
    
    if (!isPlatformManuallySelected) {
      const detected = detectPlatformFromLink(value);
      setNewDirPlatform(detected);
    }

    const trimmed = value.trim();
    if (!trimmed) {
      setFormErrors((prev) => ({ ...prev, link: undefined }));
    } else {
      const linkResult = submitDirectorySchema.shape.link.safeParse(trimmed);
      if (!linkResult.success) {
        setFormErrors((prev) => ({
          ...prev,
          link: linkResult.error.issues[0].message
        }));
      } else {
        setFormErrors((prev) => ({ ...prev, link: undefined }));
      }
    }
  };

  // Handle manual platform chip click
  const handlePlatformSelect = (platform: "web" | "reddit" | "x" | "facebook" | "github") => {
    setNewDirPlatform(platform);
    setIsPlatformManuallySelected(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsSubmitModalOpen(false);
    setNewDirName("");
    setNewDirDesc("");
    setNewDirLink("");
    setNewDirPlatform("web");
    setIsPlatformManuallySelected(false);
    setFormErrors({});
    setIsSubmitting(false);
    setSubmitStatus({ success: null, message: "" });
    setIsTurnstileLoading(true);

    // Remove ?submit from URL search params if present
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("submit")) {
        url.searchParams.delete("submit");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  };

  // Scroll lock when modal is open
  useEffect(() => {
    if (isSubmitModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSubmitModalOpen]);

  // Dynamic wrap detection for the controls panel
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const width = window.innerWidth;

      // If screen width is naturally below 1024px, let standard CSS media queries handle mobile layout
      if (width < 1024) {
        setIsForceMobile(false);
        desktopMinWidthRef.current = 0;
        return;
      }

      // If we are currently forcing mobile layout, check if window width has grown past the overflow point + buffer
      if (isForceMobile) {
        if (desktopMinWidthRef.current > 0 && width > desktopMinWidthRef.current + 30) {
          setIsForceMobile(false);
          setIsMobileSearchOpen(false); // Reset mobile search state when going back to desktop
        }
        return;
      }

      // Detect wrap in desktop layout by measuring child offsets
      const searchBox = document.querySelector(".controls-panel .search-box") as HTMLElement;
      const filterGroup = document.querySelector(".controls-panel .filter-group") as HTMLElement;

      if (searchBox && filterGroup) {
        const searchTop = searchBox.offsetTop;
        const filterTop = filterGroup.offsetTop;

        // If searchBox and filterGroup wrap onto different lines, their top offsets will differ
        if (Math.abs(searchTop - filterTop) > 5) {
          setIsForceMobile(true);
          desktopMinWidthRef.current = width;
        }
      }
    };

    // Run measurement on layout render
    const animId = requestAnimationFrame(handleResize);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isForceMobile]);

  // Turnstile Widget lifecycle management
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let observer: MutationObserver;

    if (isSubmitModalOpen && typeof window !== "undefined") {
      setIsTurnstileLoading(true);

      const renderTurnstile = () => {
        const turnstile = (window as any).turnstile;
        if (turnstile && turnstileContainerRef.current) {
          if (turnstileWidgetIdRef.current) {
            try {
              turnstile.remove(turnstileWidgetIdRef.current);
            } catch (e) {
              // Ignore
            }
          }

          // Setup observer before render to catch the iframe insertion
          observer = new MutationObserver((mutations) => {
            const iframe = turnstileContainerRef.current?.querySelector("iframe");
            if (iframe) {
              iframe.onload = () => {
                setIsTurnstileLoading(false);
                clearTimeout(timeoutId);
              };
              observer.disconnect();
            }
          });
          observer.observe(turnstileContainerRef.current, { childList: true, subtree: true });

          // Fallback timeout in case iframe onload doesn't fire or CORS limits it
          timeoutId = setTimeout(() => {
            setIsTurnstileLoading(false);
            if (observer) observer.disconnect();
          }, 5000);

          const widgetId = turnstile.render(turnstileContainerRef.current, {
            sitekey: "0x4AAAAAADfY5f5eyqmjXZrK",
            theme: theme === "dark" ? "dark" : "light",
            callback: (token: string) => {
              setTurnstileToken(token);
              setFormErrors((prev) => ({ ...prev, turnstile: undefined }));
              setIsTurnstileLoading(false);
              clearTimeout(timeoutId);
            },
            "expired-callback": () => {
              setTurnstileToken(null);
            },
            "error-callback": () => {
              setTurnstileToken(null);
              setIsTurnstileLoading(false);
              clearTimeout(timeoutId);
            }
          });
          turnstileWidgetIdRef.current = widgetId;
        }
      };

      const turnstile = (window as any).turnstile;
      if (turnstile) {
        renderTurnstile();
      } else {
        const interval = setInterval(() => {
          const t = (window as any).turnstile;
          if (t) {
            renderTurnstile();
            clearInterval(interval);
          }
        }, 100);
        return () => {
          clearInterval(interval);
          clearTimeout(timeoutId);
          if (observer) observer.disconnect();
        };
      }
    } else {
      const turnstile = (window as any).turnstile;
      if (turnstile && turnstileWidgetIdRef.current) {
        try {
          turnstile.remove(turnstileWidgetIdRef.current);
        } catch (e) {
          // Ignore
        }
        turnstileWidgetIdRef.current = null;
      }
      setTurnstileToken(null);
      setIsTurnstileLoading(false);
    }

    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, [isSubmitModalOpen, theme]);

  // Form submit handler
  const handleSubmitDirectory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const result = submitDirectorySchema.safeParse({
      name: newDirName,
      description: newDirDesc,
      link: newDirLink,
      platform: newDirPlatform,
      turnstileToken: turnstileToken || "",
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    const { name: validatedName, description: validatedDesc, link: validatedLink, platform: validatedPlatform, turnstileToken: validatedToken } = result.data;

    setIsSubmitting(true);
    setSubmitStatus({ success: null, message: "" });

    let userValidationError: string | null = null;

    try {
      const isDev = process.env.NODE_ENV === "development";
      const apiUrl = isDev ? "http://localhost:3001" : "";
      const res = await fetch(`${apiUrl}/api/submit-directory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: validatedName,
          description: validatedDesc,
          link: validatedLink,
          platform: validatedPlatform,
          turnstileToken: validatedToken,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        // Fallback for non-JSON responses
      }

      if (!res.ok) {
        if (res.status === 400 && data.error) {
          userValidationError = data.error;
        }
        throw new Error(userValidationError || "Something went wrong. Please try again later.");
      }

      setSubmitStatus({
        success: true,
        message: `Successfully submitted! Created issue #${data.issueNumber}.`,
      });

      // Clear inputs
      setNewDirName("");
      setNewDirDesc("");
      setNewDirLink("");
      setNewDirPlatform("web");
      setIsPlatformManuallySelected(false);
      setFormErrors({});

      // Auto close modal after brief delay
      setTimeout(() => {
        handleCloseModal();
      }, 2500);

    } catch (err: any) {
      console.error("Submission error:", err);
      
      // Show validation errors to the user, but mask system/config/network errors
      const displayMessage = userValidationError || "Something went wrong. Please try again later.";

      setSubmitStatus({
        success: false,
        message: displayMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Intersection Observer for lazy loading items
  useEffect(() => {
    if (loading || filteredData.length <= visibleCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 24, filteredData.length));
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentTrigger = loadMoreRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [loading, filteredData.length, visibleCount]);

  // Calculate stats for badges
  const stats = useMemo(() => {
    const counts = { all: allData.length, reddit: 0, x: 0, facebook: 0, github: 0, web: 0 };
    allData.forEach((item) => {
      const type = getPlatformType(item.name, item.submission_link);
      if (type in counts) {
        counts[type as keyof typeof counts]++;
      }
    });
    return counts;
  }, [allData]);

  // Render cards currently visible
  const visibleItems = useMemo(() => {
    return filteredData.slice(0, visibleCount);
  }, [filteredData, visibleCount]);

  // Structured Data Schema for SEO/AIO/AEO/GEO
  const jsonLdSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `LaunchDB - ${formattedCount} SaaS Directories & Product Launchpads`,
      "description": `A curated directory database of ${formattedCount} platforms and directories to launch your SaaS product, get backlinks, and reach early users.`,
      "numberOfItems": allData.length,
      "itemListElement": allData.slice(0, 50).map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "SoftwareApplication",
          "name": item.name.replace(/^(r\/|fb\/|gh\/|x\/)/i, ""),
          "description": item.description,
          "applicationCategory": "BusinessApplication",
          "url": item.submission_link
        }
      }))
    };
  }, [allData]);

  return (
    <div className="page-dark-bg">
      <ClickSpark
        sparkColor={theme === "light" ? "magenta" : "#ffffff"}
        sparkSize={10}
        sparkRadius={20}
        sparkCount={8}
        duration={400}
      >
        {/* Schema injection for search engines & AI crawlers */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />

      <div className="top-header-group">
        <nav className="top-nav">
          <div className="container nav-container">
            <a href="/" className="nav-logo">
              <span className="logo-emoji">🚀</span>
              <span className="logo-text">LaunchDB</span>
            </a>
            <div className="nav-actions">
              <a
                href="https://github.com/theshubh77/awesome-saas-directories"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-github-link"
                title="GitHub Source"
              >
                <GithubLogo size={34} weight="light" />
              </a>
              <button
                onClick={toggleTheme}
                className="theme-toggle-btn"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {mounted ? (
                  theme === "dark" ? (
                    <Sun size={34} weight="light" className="sun-icon" />
                  ) : (
                    <Moon size={34} weight="light" className="moon-icon" />
                  )
                ) : (
                  <div className="theme-toggle-placeholder" />
                )}
              </button>
              <a 
                href="https://buymeacoffee.com/theshubh77"
                target="_blank"
                rel="noopener noreferrer"
                className="bmc-link"
                title="Buy Me a Coffee"
              >
                {mounted ? (
                  <img 
                    src={theme === "dark" ? "/assets/bmc-logo-dark.svg" : "/assets/bmc-logo-light.svg"} 
                    alt="Buy Me a Coffee" 
                    className="bmc-logo"
                  />
                ) : (
                  <div className="bmc-logo-placeholder" />
                )}
              </a>
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="nav-submit-btn"
                title="Submit Directory"
              >
                <Plus size={18} weight="bold" />
                <span className="nav-submit-text">Submit Directory</span>
              </button>
            </div>
          </div>
        </nav>

        <header className="hero-section">
          <div className="container">
            <StarBorder
              as="div"
              className="hero-tag-wrapper"
              color="magenta"
              speed="5s"
              thickness={1}
            >
              <Lightning size={16} weight="fill" />
              <span>{formattedCount} Active Directories & Launchpads</span>
            </StarBorder>
            <h1 className="hero-title">
              <span>🚀</span>
              <span className="hero-title-text">LaunchDB</span>
            </h1>
            <p className="hero-desc">
              Discover {formattedCount} platforms, subreddits, communities, and directories to submit your SaaS, build backlinks, and find early adopters.
            </p>
          </div>
        </header>
      </div>

      <main className="container">
        {/* Sentinel to detect when controls become sticky */}
        <div ref={sentinelRef} className="scroll-sentinel" />
        {/* Controls Grid */}
        <div className={`controls-wrapper ${isSticky ? "is-sticky" : ""}`}>
          <section className={`controls-panel ${isMobileSearchOpen ? "search-open" : ""} ${isForceMobile ? "force-mobile" : ""}`}>
            <button 
              type="button"
              className="mobile-search-toggle" 
              onClick={() => setIsMobileSearchOpen(true)}
              aria-label="Open search"
            >
              <MagnifyingGlass size={20} />
            </button>

            <div className="search-box">
              <MagnifyingGlass size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search directories, communities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <button 
                type="button"
                className="mobile-search-close" 
                onClick={() => {
                  setSearch(""); // clear search on close
                  setIsMobileSearchOpen(false);
                }}
                aria-label="Close search"
              >
                <X size={20} />
              </button>
            </div>

            <div className="filter-group">
              <button
                onClick={() => setPlatformFilter("all")}
                className={`filter-chip ${platformFilter === "all" ? "active" : ""}`}
              >
                All <span className="filter-count">{stats.all}</span>
              </button>
              <button
                onClick={() => setPlatformFilter("web")}
                className={`filter-chip ${platformFilter === "web" ? "active" : ""}`}
              >
                <Globe size={16} />
                Web Directory <span className="filter-count">{stats.web}</span>
              </button>
              <button
                onClick={() => setPlatformFilter("reddit")}
                className={`filter-chip ${platformFilter === "reddit" ? "active" : ""}`}
              >
                <RedditLogo size={16} />
                Reddit <span className="filter-count">{stats.reddit}</span>
              </button>
              <button
                onClick={() => setPlatformFilter("x")}
                className={`filter-chip ${platformFilter === "x" ? "active" : ""}`}
              >
                <XLogo size={16} />
                X (Twitter) <span className="filter-count">{stats.x}</span>
              </button>
              <button
                onClick={() => setPlatformFilter("facebook")}
                className={`filter-chip ${platformFilter === "facebook" ? "active" : ""}`}
              >
                <FacebookLogo size={16} />
                Facebook <span className="filter-count">{stats.facebook}</span>
              </button>
              <button
                onClick={() => setPlatformFilter("github")}
                className={`filter-chip ${platformFilter === "github" ? "active" : ""}`}
              >
                <GithubLogo size={16} />
                GitHub <span className="filter-count">{stats.github}</span>
              </button>
            </div>
          </section>
        </div>

        {/* Directory Stats */}
        <div className="stats-bar">
          <div>
            Showing <span className="highlight">{filteredData.length}</span> of {allData.length} directories
            {fetchError && <span style={{ color: "var(--reddit-text)", marginLeft: "0.5rem" }}>(Fallback Mode)</span>}
          </div>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ArrowClockwise size={18} className="animate-spin" />
              Loading...
            </div>
          )}
        </div>

        {/* Cards Grid */}
        {loading && allData.length === 0 ? (
          <section className="directory-grid">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div key={idx} className="skeleton-card">
                <div className="card-header">
                  <div className="shimmer shimmer-favicon" />
                  <div className="shimmer shimmer-badge" />
                </div>
                <div className="card-body">
                  <div className="shimmer shimmer-title" />
                  <div className="shimmer shimmer-text" />
                  <div className="shimmer shimmer-text" />
                  <div className="shimmer shimmer-text short" />
                </div>
                <div className="shimmer shimmer-btn" />
              </div>
            ))}
          </section>
        ) : filteredData.length > 0 ? (
          <section className="directory-grid">
            {visibleItems.map((item) => (
              <DirectoryCard key={item.id} item={item} theme={theme} />
            ))}
          </section>
        ) : (
          <div className="empty-state">
            <Database size={48} className="empty-icon" />
            <h3 className="empty-title">No directories found</h3>
            <p className="empty-desc">
              We couldn't find anything matching "{search}". Try adjusting your filters or search keywords.
            </p>
          </div>
        )}

        {/* Trigger element for IntersectionObserver lazy load */}
        {!loading && filteredData.length > visibleCount && (
          <div ref={loadMoreRef} className="load-more-trigger">
            <ArrowClockwise size={20} className="animate-spin" style={{ marginRight: "0.5rem" }} />
            Loading more directories...
          </div>
        )}

        {/* FAQ Section - SEO, AEO, and GEO Optimization */}
        <section className="faq-section" id="faq">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3 className="faq-question">
                <BookOpen size={22} /> What is LaunchDB?
              </h3>
              <p className="faq-answer">
                LaunchDB is a professional open-source directory listing platform for SaaS startups. It indexes over {formattedCount} platforms, directory sites, subreddits, and communities where founders can launch their software to get traffic, feedback, and high-quality SEO backlink profiles.
              </p>
            </div>
            
            <div className="faq-item">
              <h3 className="faq-question">
                <Lightning size={22} /> How does the realtime fetch work?
              </h3>
              <p className="faq-answer">
                LaunchDB connects directly to the repository of launchdb using the GitHub raw API. Every time the website loads, it pulls the most up-to-date JSON data, meaning any updates on the GitHub source code appear on our directory instantly. If the API is offline, it drops back to a built-in JSON fallback snapshot.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">
                <Database size={22} /> How can I submit my own directory?
              </h3>
              <p className="faq-answer">
                Since our primary data source is the launchdb repository, you can add your directory by making a contribution there. Simply clone the repository, add your directory to the `launchdb.json` data file, and submit a Pull Request. Once merged, it will display on LaunchDB in real-time.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">
                <Globe size={22} /> Why should I list my SaaS in directories?
              </h3>
              <p className="faq-answer">
                Listing on niche product directories increases your search presence, helps AI crawlers (like ChatGPT, Gemini, and Claude) index your product in answer engine results (AEO/GEO), drives domain authority via do-follow/no-follow backlinks (SEO), and exposes your tool to early-stage power users.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-content">
          <p className="footer-text">
            Built with <span className="pulsing-heart">❤️</span> by{" "}
            <a 
              href="https://linktr.ee/theshubh77" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-author-link"
            >
              Shubham Bhamare
            </a>
          </p>
          <div className="footer-socials">
            <a 
              href="https://facebook.com/theshubh77" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Facebook" 
              className="footer-social-link"
            >
              <FacebookLogo size={24} />
            </a>
            <a 
              href="https://instagram.com/theshubh77" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Instagram" 
              className="footer-social-link"
            >
              <InstagramLogo size={24} />
            </a>
            <a 
              href="https://linkedin.com/in/theshubh77" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="LinkedIn" 
              className="footer-social-link"
            >
              <LinkedinLogo size={24} />
            </a>
            <a 
              href="https://github.com/theshubh77" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="GitHub" 
              className="footer-social-link"
            >
              <GithubLogo size={24} />
            </a>
            <a 
              href="https://x.com/theshubh77" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="X" 
              className="footer-social-link"
            >
              <XLogo size={24} />
            </a>
            <a 
              href="https://medium.com/@theshubh77" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Medium" 
              className="footer-social-link"
            >
              <MediumLogo size={24} />
            </a>
          </div>
        </div>
      </footer>

      {/* Submit Directory Popup Modal */}
      {isSubmitModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Submit Directory</h2>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={handleCloseModal} 
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitDirectory} className="modal-form" noValidate>
              {submitStatus.message && (
                <div className={`status-banner ${submitStatus.success ? "success" : "error"}`}>
                  <span>{submitStatus.success ? "✓" : "⚠"} {submitStatus.message}</span>
                </div>
              )}

              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="dirName" className="form-label">Directory Name</label>
                  <span className={`char-counter ${newDirName.length > 25 ? "warning" : ""}`}>
                    {newDirName.length}/30
                  </span>
                </div>
                <input
                  id="dirName"
                  type="text"
                  placeholder="e.g. Product Hunt or r/SideProject"
                  value={newDirName}
                  onChange={(e) => {
                    setNewDirName(e.target.value.slice(0, 30));
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  className={`form-input ${formErrors.name ? "input-error" : ""}`}
                  maxLength={30}
                  required
                />
                {formErrors.name && <span className="error-message">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="dirDesc" className="form-label">Description</label>
                  <span className={`char-counter ${newDirDesc.length > 120 ? "warning" : ""}`}>
                    {newDirDesc.length}/140
                  </span>
                </div>
                <textarea
                  id="dirDesc"
                  placeholder="e.g. A popular launch platform for sharing new tech products..."
                  value={newDirDesc}
                  onChange={(e) => {
                    setNewDirDesc(e.target.value.slice(0, 140));
                    if (formErrors.description) setFormErrors(prev => ({ ...prev, description: undefined }));
                  }}
                  className={`form-textarea ${formErrors.description ? "input-error" : ""}`}
                  maxLength={140}
                  rows={3}
                  required
                />
                {formErrors.description && <span className="error-message">{formErrors.description}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="dirLink" className="form-label">Submission Link</label>
                <input
                  id="dirLink"
                  type="url"
                  placeholder="e.g. https://www.producthunt.com/posts/new"
                  value={newDirLink}
                  onChange={handleLinkChange}
                  className={`form-input ${formErrors.link ? "input-error" : ""}`}
                  required
                />
                {formErrors.link && <span className="error-message">{formErrors.link}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Platform Category</label>
                <div className="platform-select-chips">
                  <button
                    type="button"
                    onClick={() => handlePlatformSelect("web")}
                    className={`platform-select-chip web ${newDirPlatform === "web" ? "active" : ""}`}
                  >
                    <Globe size={14} weight="bold" />
                    <span>Web Directory</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlatformSelect("reddit")}
                    className={`platform-select-chip reddit ${newDirPlatform === "reddit" ? "active" : ""}`}
                  >
                    <RedditLogo size={14} weight="fill" />
                    <span>Reddit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlatformSelect("x")}
                    className={`platform-select-chip x ${newDirPlatform === "x" ? "active" : ""}`}
                  >
                    <XLogo size={14} weight="bold" />
                    <span>X (Twitter)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlatformSelect("facebook")}
                    className={`platform-select-chip facebook ${newDirPlatform === "facebook" ? "active" : ""}`}
                  >
                    <FacebookLogo size={14} weight="fill" />
                    <span>Facebook</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlatformSelect("github")}
                    className={`platform-select-chip github ${newDirPlatform === "github" ? "active" : ""}`}
                  >
                    <GithubLogo size={14} weight="fill" />
                    <span>GitHub</span>
                  </button>
                </div>
              </div>

              {/* Cloudflare Turnstile CAPTCHA */}
              <div className="turnstile-wrapper">
                {isTurnstileLoading && (
                  <div className="turnstile-loading">
                    <Spinner size={16} className="animate-spin" />
                    <span>Loading security check...</span>
                  </div>
                )}
                <div 
                  ref={turnstileContainerRef} 
                  style={{ 
                    visibility: isTurnstileLoading ? "hidden" : "visible", 
                    position: isTurnstileLoading ? "absolute" : "static" 
                  }} 
                />
              </div>
              {formErrors.turnstile && (
                <span className="error-message turnstile-error">
                  {formErrors.turnstile}
                </span>
              )}

              <button type="submit" className="modal-submit-btn" disabled={isSubmitting || !turnstileToken}>
                {isSubmitting ? (
                  <>
                    <ArrowClockwise size={16} className="animate-spin" style={{ marginRight: "0.5rem" }} />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} weight="bold" />
                    <span>Submit Directory</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={scrollToTop}
        className={`back-to-top-btn ${showBackToTop ? "visible" : ""}`}
        aria-label="Back to top"
        title="Back to top"
      >
        <CaretUp size={24} weight="bold" />
      </button>

      {/* Load Cloudflare Turnstile script dynamically */}
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" 
        strategy="afterInteractive" 
      />
      </ClickSpark>
    </div>
  );
}
