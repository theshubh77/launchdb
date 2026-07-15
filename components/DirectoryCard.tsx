"use client";

import React, { useState } from "react";
import { 
  ArrowUpRight, 
  RedditLogo, 
  XLogo, 
  FacebookLogo, 
  GithubLogo, 
  Globe 
} from "@phosphor-icons/react";
import BorderGlow from "./BorderGlow";

interface DirectoryItem {
  id: number;
  name: string;
  description: string;
  submission_link: string;
  domain_rating?: number | null;
  dr_last_updated?: string | null;
}

interface DirectoryCardProps {
  item: DirectoryItem;
  theme: "light" | "dark";
}

export default function DirectoryCard({ item, theme }: DirectoryCardProps) {
  const { name, description, submission_link } = item;
  const [faviconError, setFaviconError] = useState(false);

  // Helper to extract domain from URL
  const getDomain = (url: string): string => {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return "";
    }
  };

  const domain = getDomain(submission_link);
  
  // Categorize directory based on name and link patterns
  const getPlatform = (name: string, link: string) => {
    const nameLower = name.toLowerCase();
    const linkLower = link.toLowerCase();

    if (nameLower.startsWith("r/") || /(?:^|[^a-z0-9-])reddit\.com(?:\/|\?|#|:|$)/i.test(linkLower)) {
      return {
        label: "Reddit",
        class: "reddit",
        icon: <RedditLogo size={16} weight="fill" />,
        tooltip: "Reddit Community"
      };
    }
    if (nameLower.startsWith("x/") || /(?:^|[^a-z0-9-])(?:x|twitter)\.com(?:\/|\?|#|:|$)/i.test(linkLower)) {
      return {
        label: "X (Twitter)",
        class: "x",
        icon: <XLogo size={16} weight="bold" />,
        tooltip: "X (Twitter) Community"
      };
    }
    if (nameLower.startsWith("fb/") || /(?:^|[^a-z0-9-])(?:facebook|fb)\.com(?:\/|\?|#|:|$)/i.test(linkLower)) {
      return {
        label: "Facebook",
        class: "facebook",
        icon: <FacebookLogo size={16} weight="fill" />,
        tooltip: "Facebook Group"
      };
    }
    if (nameLower.startsWith("gh/") || /(?:^|[^a-z0-9-])github\.com(?:\/|\?|#|:|$)/i.test(linkLower)) {
      return {
        label: "GitHub",
        class: "github",
        icon: <GithubLogo size={16} weight="fill" />,
        tooltip: "GitHub Repository"
      };
    }
    return {
      label: "Web Directory",
      class: "web",
      icon: <Globe size={16} weight="bold" />,
      tooltip: "Web Directory"
    };
  };

  const platform = getPlatform(name, submission_link);
  
  // Clean name: remove prefixes like "r/", "fb/", "gh/", "x/" for displaying
  const cleanName = name.replace(/^(r\/|fb\/|gh\/|x\/)/i, "");

  // Use Google Favicon Service
  const faviconUrl = domain 
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    : null;

  const cardContent = (
    <>
      <div className="card-header">
        <div className="favicon-wrapper">
          {faviconUrl && !faviconError ? (
            <img 
              src={faviconUrl} 
              alt={`${cleanName} Favicon`}
              className="favicon-img"
              onError={() => setFaviconError(true)}
              loading="lazy"
            />
          ) : (
            <span className="favicon-fallback">
              {cleanName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="card-badges">
          {platform.class === "web" && item.domain_rating !== undefined && item.domain_rating !== null && (
            <span 
              className="dr-pill" 
              title="Domain Rating powered by Ahrefs"
            >
              DR {item.domain_rating}
            </span>
          )}
          <span 
            className={`platform-chip ${platform.class}`}
            title={platform.tooltip}
          >
            {platform.icon}
            {platform.label}
          </span>
        </div>
      </div>

      <div className="card-body">
        <h3 className="card-title">{cleanName}</h3>
        <p className="card-desc" title={description}>{description}</p>
      </div>

      <div className="card-footer">
        <a 
          href={submission_link}
          target="_blank"
          rel="noopener noreferrer"
          className="submit-btn"
        >
          <span className="submit-btn-text">Submit Product</span>
          <ArrowUpRight size={18} />
        </a>
      </div>
    </>
  );

  if (theme === "light") {
    return (
      <article className="card">
        {cardContent}
      </article>
    );
  }

  return (
    <BorderGlow
      edgeSensitivity={30}
      glowColor="260 80 80"
      backgroundColor="var(--bg-secondary)"
      borderRadius={16}
      glowRadius={30}
      glowIntensity={0.6}
      coneSpread={30}
      animated={false}
      colors={['#8b5cf6', '#6366f1', '#a855f7']}
    >
      <article className="card" style={{ background: 'transparent', border: 'none', boxShadow: 'none', height: '100%', padding: '1.5rem', transform: 'none' }}>
        {cardContent}
      </article>
    </BorderGlow>
  );
}
