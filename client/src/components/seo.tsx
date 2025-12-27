import { useEffect, useMemo } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: object;
  robots?: string;
}

const defaultSEO = {
  title: "CODEX Wallet - Secure Cryptocurrency Payment Processing & Digital Assets",
  description: "Advanced cryptocurrency platform with CODEX Pay payment processing, NFT marketplace, crypto wallet management, and DeFi trading tools. Secure, fast, and simple digital asset management.",
  keywords: ["codex wallet", "codex pay", "crypto payments", "payment processing", "crypto wallet", "NFT marketplace", "cryptocurrency platform", "digital assets", "blockchain platform", "crypto trading", "web3 platform", "DeFi tools", "blockchain payments"],
  ogImage: "/og-image.png",
  twitterImage: "/twitter-image.png"
};

export default function SEO({
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage,
  twitterTitle,
  twitterDescription,
  twitterImage,
  structuredData,
  robots
}: SEOProps) {
  // Memoize computed values to prevent unnecessary re-renders
  const fullTitle = useMemo(() => {
    return title ? `${title} | CODEX Wallet` : defaultSEO.title;
  }, [title]);
  
  const fullDescription = useMemo(() => {
    return description || defaultSEO.description;
  }, [description]);
  
  // Memoize keywords to prevent effect churn
  const fullKeywords = useMemo(() => {
    return [...defaultSEO.keywords, ...keywords];
  }, [keywords]);
  
  const fullOgTitle = useMemo(() => {
    return ogTitle || fullTitle;
  }, [ogTitle, fullTitle]);
  
  const fullOgDescription = useMemo(() => {
    return ogDescription || fullDescription;
  }, [ogDescription, fullDescription]);
  
  const fullOgImage = useMemo(() => {
    return ogImage || defaultSEO.ogImage;
  }, [ogImage]);
  
  const fullTwitterTitle = useMemo(() => {
    return twitterTitle || fullTitle;
  }, [twitterTitle, fullTitle]);
  
  const fullTwitterDescription = useMemo(() => {
    return twitterDescription || fullDescription;
  }, [twitterDescription, fullDescription]);
  
  const fullTwitterImage = useMemo(() => {
    return twitterImage || defaultSEO.twitterImage;
  }, [twitterImage]);
  
  const currentUrl = useMemo(() => {
    return canonicalUrl || window.location.pathname;
  }, [canonicalUrl]);

  useEffect(() => {
    // Update title
    document.title = fullTitle;

    // Helper function to update or create meta tag
    const updateMetaTag = (selector: string, content: string, property?: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        if (property) {
          element.setAttribute(property, selector.replace(/meta\[|\]|"/g, '').split('=')[1]);
        } else {
          element.setAttribute('name', selector.replace(/meta\[|\]|name="|"/g, ''));
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update basic meta tags
    updateMetaTag('meta[name="description"]', fullDescription);
    updateMetaTag('meta[name="keywords"]', fullKeywords.join(', '));
    
    // Update robots meta tag if provided
    if (robots) {
      updateMetaTag('meta[name="robots"]', robots);
    }
    
    // Update canonical URL
    let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.rel = 'canonical';
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.href = window.location.origin + currentUrl;

    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', fullOgTitle, 'property');
    updateMetaTag('meta[property="og:description"]', fullOgDescription, 'property');
    updateMetaTag('meta[property="og:image"]', window.location.origin + fullOgImage, 'property');
    updateMetaTag('meta[property="og:url"]', window.location.origin + currentUrl, 'property');

    // Update Twitter Card tags
    updateMetaTag('meta[name="twitter:title"]', fullTwitterTitle);
    updateMetaTag('meta[name="twitter:description"]', fullTwitterDescription);
    updateMetaTag('meta[name="twitter:image"]', window.location.origin + fullTwitterImage);
    updateMetaTag('meta[name="twitter:url"]', window.location.origin + currentUrl);

    // Add structured data if provided
    if (structuredData) {
      // Remove existing structured data script for this page
      const existingScript = document.querySelector('script[data-page-structured-data]');
      if (existingScript) {
        existingScript.remove();
      }

      // Add new structured data
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-page-structured-data', 'true');
      // Ensure structured data URLs are absolute
      const absoluteStructuredData = JSON.parse(JSON.stringify(structuredData));
      
      // Recursively convert relative URLs to absolute URLs in structured data
      const makeUrlsAbsolute = (obj: any): any => {
        if (typeof obj === 'string' && obj.startsWith('/') && !obj.startsWith('//')) {
          return window.location.origin + obj;
        }
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              obj[key] = makeUrlsAbsolute(obj[key]);
            }
          }
        }
        return obj;
      };
      
      script.textContent = JSON.stringify(makeUrlsAbsolute(absoluteStructuredData), null, 2);
      document.head.appendChild(script);
    }
  }, [fullTitle, fullDescription, fullKeywords, currentUrl, fullOgTitle, fullOgDescription, fullOgImage, fullTwitterTitle, fullTwitterDescription, fullTwitterImage, structuredData]);

  return null;
}