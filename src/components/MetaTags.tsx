import React, { useEffect } from 'react';

type MetaConfig = {
  title?: string;
  description?: string;
  robots?: string;
  canonicalUrl?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
};

interface MetaTagsProps {
  config: MetaConfig;
}

const ensureMetaTag = (name: string, attr: 'name' | 'property', content: string) => {
  if (!content) return;
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

export const MetaTags: React.FC<MetaTagsProps> = ({ config }) => {
  useEffect(() => {
    if (config.title) {
      document.title = config.title;
    }

    if (config.description) {
      ensureMetaTag('description', 'name', config.description);
    }

    if (config.robots) {
      ensureMetaTag('robots', 'name', config.robots);
    }

    if (config.canonicalUrl) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = config.canonicalUrl;
    }

    const og = config.openGraph || {};
    const twitter = config.twitter || {};

    // Open Graph
    if (og.title || config.title) {
      ensureMetaTag('og:title', 'property', og.title || config.title || '');
    }
    if (og.description || config.description) {
      ensureMetaTag('og:description', 'property', og.description || config.description || '');
    }
    if (og.url) {
      ensureMetaTag('og:url', 'property', og.url);
    }
    if (og.image) {
      ensureMetaTag('og:image', 'property', og.image);
    }
    if (og.type) {
      ensureMetaTag('og:type', 'property', og.type);
    }

    // Twitter
    if (twitter.card) {
      ensureMetaTag('twitter:card', 'name', twitter.card);
    }
    if (twitter.title || config.title) {
      ensureMetaTag('twitter:title', 'name', twitter.title || config.title || '');
    }
    if (twitter.description || config.description) {
      ensureMetaTag(
        'twitter:description',
        'name',
        twitter.description || config.description || '',
      );
    }
    if (twitter.image) {
      ensureMetaTag('twitter:image', 'name', twitter.image);
    }

    return () => {
      // We intentionally do not remove tags on unmount to avoid flicker
      // when navigating quickly between routes. Tags will be overwritten
      // by the next page's MetaTags component.
    };
  }, [config]);

  return null;
};

export type { MetaConfig };
