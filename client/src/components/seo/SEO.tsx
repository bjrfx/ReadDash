import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'ReadDash - Improve Your Reading Skills',
  description = 'ReadDash helps you improve your reading skills through personalized quizzes, vocabulary building, and progress tracking.',
  keywords = 'reading, comprehension, vocabulary, education, learning, quizzes',
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage = '/icon-512.png',
  ogUrl,
  twitterTitle,
  twitterDescription,
  twitterImage,
}) => {
  const siteUrl = 'https://readdash.app'; // Update with your actual site URL
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:url" content={ogUrl || fullCanonicalUrl} />
      <meta property="og:site_name" content="ReadDash" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={twitterTitle || ogTitle || title} />
      <meta name="twitter:description" content={twitterDescription || ogDescription || description} />
      <meta name="twitter:image" content={twitterImage ? `${siteUrl}${twitterImage}` : `${siteUrl}${ogImage}`} />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="robots" content="index, follow" />
    </Helmet>
  );
};

export default SEO;