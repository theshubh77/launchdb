"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  MagnifyingGlass, 
  ArrowClockwise, 
  GithubLogo, 
  RedditLogo, 
  XLogo, 
  FacebookLogo, 
  Globe, 
  BookOpen, 
  Database,
  Lightning,
  Sun,
  Moon,
  X,
  Plus
} from "@phosphor-icons/react";
import DirectoryCard from "../components/DirectoryCard";

interface DirectoryItem {
  id: number;
  name: string;
  description: string;
  submission_link: string;
}

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

  // Submit Directory Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newDirName, setNewDirName] = useState("");
  const [newDirDesc, setNewDirDesc] = useState("");
  const [newDirLink, setNewDirLink] = useState("");
  const [newDirPlatform, setNewDirPlatform] = useState<"web" | "reddit" | "x" | "facebook" | "github">("web");
  const [isPlatformManuallySelected, setIsPlatformManuallySelected] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; description?: string; link?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Handle link change with auto platform detection
  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewDirLink(value);
    
    if (formErrors.link) {
      setFormErrors((prev) => ({ ...prev, link: undefined }));
    }

    if (!isPlatformManuallySelected) {
      const detected = detectPlatformFromLink(value);
      setNewDirPlatform(detected);
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

  // Form submit handler
  const handleSubmitDirectory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: { name?: string; description?: string; link?: string } = {};
    const trimmedName = newDirName.trim();
    const trimmedDesc = newDirDesc.trim();
    const trimmedLink = newDirLink.trim();

    if (!trimmedName) {
      errors.name = "Directory name is required";
    } else if (trimmedName.length > 30) {
      errors.name = "Directory name must be 30 characters or less";
    }

    if (!trimmedDesc) {
      errors.description = "Description is required";
    } else if (trimmedDesc.length > 140) {
      errors.description = "Description must be 140 characters or less";
    }

    const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
    if (!trimmedLink) {
      errors.link = "Submission link is required";
    } else if (!urlRegex.test(trimmedLink)) {
      errors.link = "Please enter a valid URL (starting with http:// or https://)";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ success: null, message: "" });

    try {
      const isDev = process.env.NODE_ENV === "development";
      const apiUrl = isDev ? "http://localhost:3001" : "";
      const res = await fetch(`${apiUrl}/api/submit-directory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDesc,
          link: trimmedLink,
          platform: newDirPlatform,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
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
      setSubmitStatus({
        success: false,
        message: err.message || "An error occurred while submitting.",
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
      "name": "LaunchDB SaaS Directories",
      "description": "A curated directory database of places to launch your SaaS product, get backlinks, and reach early users.",
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
    <>
      {/* Schema injection for search engines & AI crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <div className="top-header-group">
        <nav className="top-nav">
          <div className="container nav-container">
            <a href="/" className="nav-logo">
              <Database size={24} weight="fill" className="logo-icon" />
              <span>LaunchDB</span>
            </a>
            <div className="nav-actions">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="nav-submit-btn"
                title="Submit Directory"
              >
                <Plus size={18} weight="bold" />
                <span className="nav-submit-text">Submit Directory</span>
              </button>
              <a
                href="https://github.com/theshubh77/awesome-saas-directories"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-github-link"
                title="GitHub Source"
              >
                <GithubLogo size={22} weight="bold" />
              </a>
              <button
                onClick={toggleTheme}
                className="theme-toggle-btn"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {mounted ? (
                  theme === "dark" ? (
                    <Sun size={20} weight="fill" />
                  ) : (
                    <Moon size={20} weight="fill" />
                  )
                ) : (
                  <div className="theme-toggle-placeholder" />
                )}
              </button>
            </div>
          </div>
        </nav>

        <header className="hero-section">
          <div className="container">
            <div className="hero-tag">
              <Lightning size={16} weight="fill" />
              <span>120+ Active Directories & Launchpads</span>
            </div>
            <h1 className="hero-title">LaunchDB</h1>
            <p className="hero-desc">
              Discover 120+ platforms, subreddits, communities, and directories to submit your SaaS, build backlinks, and find early adopters.
            </p>
          </div>
        </header>
      </div>

      <main className="container">
        {/* Controls Grid */}
        <div className="controls-wrapper">
          <section className={`controls-panel ${isMobileSearchOpen ? "search-open" : ""}`}>
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
              <DirectoryCard key={item.id} item={item} />
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
                LaunchDB is a professional open-source directory listing platform for SaaS startups. It indexes over 120+ platforms, directory sites, subreddits, and communities where founders can launch their software to get traffic, feedback, and high-quality SEO backlink profiles.
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
          <p>
            © 2026 LaunchDB. Built with <span className="pulsing-heart">❤️</span> by{" "}
            <a 
              href="https://linktr.ee/theshubh77" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-author-link"
            >
              Shubham Bhamare
            </a>
          </p>
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
                    <span>Web</span>
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
                    <span>X</span>
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

              <button type="submit" className="modal-submit-btn" disabled={isSubmitting}>
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
    </>
  );
}
