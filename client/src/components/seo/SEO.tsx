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
  // New props for schema data
  schemaType?: 'WebApplication' | 'EducationalApplication' | 'Quiz' | 'Article';
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  quizData?: {
    name: string;
    description: string;
    numberOfQuestions?: number;
    timeRequired?: string;
    educationalLevel?: string;
    category?: string;
  };
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
  // Default schema data
  schemaType = 'WebApplication',
  datePublished = new Date().toISOString(),
  dateModified = new Date().toISOString(),
  authorName = 'ReadDash',
  quizData,
}) => {
  const siteUrl = 'https://readdash.app'; // Update with your actual site URL
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;

  // Create the appropriate schema markup based on the page type
  const generateSchemaMarkup = () => {
    // Common schema properties
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      name: title,
      description: description,
      url: fullCanonicalUrl,
      image: `${siteUrl}${ogImage}`,
      author: {
        '@type': 'Organization',
        name: authorName,
      },
      datePublished: datePublished,
      dateModified: dateModified,
    };

    // Add specific properties based on schema type
    switch (schemaType) {
      case 'Quiz':
        if (quizData) {
          return {
            ...baseSchema,
            educationalAlignment: quizData.educationalLevel ? {
              '@type': 'AlignmentObject',
              educationalFramework: 'Reading Level',
              targetName: quizData.educationalLevel,
            } : undefined,
            about: quizData.category,
            timeRequired: quizData.timeRequired,
            numberOfQuestions: quizData.numberOfQuestions,
          };
        }
        return baseSchema;
      
      case 'EducationalApplication':
        return {
          ...baseSchema,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web Browser',
          offers: {
            '@type': 'Offer',
            price: '0.00',
            priceCurrency: 'USD',
            availability: 'https://schema.org/OnlineOnly',
          },
        };
        
      case 'WebApplication':
      default:
        return {
          ...baseSchema,
          applicationCategory: 'EducationApplication',
          operatingSystem: 'Web Browser',
        };
    }
  };

  const schemaMarkup = generateSchemaMarkup();

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
      
      {/* Schema.org JSON-LD structured data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaMarkup)}
      </script>
    </Helmet>
  );
};

export default SEO;