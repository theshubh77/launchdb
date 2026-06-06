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

interface DirectoryItem {
  id: number;
  name: string;
  description: string;
  submission_link: string;
}

interface DirectoryCardProps {
  item: DirectoryItem;
}

export default function DirectoryCard({ item }: DirectoryCardProps) {
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

    if (nameLower.startsWith("r/") || linkLower.includes("reddit.com")) {
      return {
        label: "Reddit",
        class: "reddit",
        icon: <RedditLogo size={16} weight="fill" />
      };
    }
    if (nameLower.startsWith("x/") || linkLower.includes("x.com") || linkLower.includes("twitter.com")) {
      return {
        label: "X (Twitter)",
        class: "x",
        icon: <XLogo size={16} weight="bold" />
      };
    }
    if (nameLower.startsWith("fb/") || linkLower.includes("facebook.com")) {
      return {
        label: "Facebook",
        class: "facebook",
        icon: <FacebookLogo size={16} weight="fill" />
      };
    }
    if (nameLower.startsWith("gh/") || linkLower.includes("github.com")) {
      return {
        label: "GitHub",
        class: "github",
        icon: <GithubLogo size={16} weight="fill" />
      };
    }
    return {
      label: "Web Directory",
      class: "web",
      icon: <Globe size={16} weight="bold" />
    };
  };

  const platform = getPlatform(name, submission_link);
  
  // Clean name: remove prefixes like "r/", "fb/", "gh/", "x/" for displaying
  const cleanName = name.replace(/^(r\/|fb\/|gh\/|x\/)/i, "");

  // Use Google Favicon Service
  const faviconUrl = domain 
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    : null;

  return (
    <article className="card">
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
        <span className={`platform-chip ${platform.class}`}>
          {platform.icon}
          {platform.label}
        </span>
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
    </article>
  );
}
