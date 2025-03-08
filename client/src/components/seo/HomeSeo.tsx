import React from 'react';
import Metadata from './Metadata';
import { LocalBusinessStructuredData } from './StructuredData';
import { useSeo } from '@/contexts/SeoContext';

interface HomeSeoProps {
  title?: string;
  description?: string;
}

const HomeSeo: React.FC<HomeSeoProps> = ({ 
  title, 
  description 
}) => {
  const { 
    siteTitle, 
    siteDescription, 
    siteUrl, 
    siteImage, 
    siteName 
  } = useSeo();
  
  return (
    <>
      <Metadata
        title={title || siteTitle}
        description={description || siteDescription}
        imageUrl={siteImage}
        type="website"
      />
      
      <LocalBusinessStructuredData
        name={siteName}
        url={siteUrl}
        logo={`${siteUrl}/images/logo.png`}
        description={siteDescription}
        sameAs={[
          'https://facebook.com/arcemusa',
          'https://twitter.com/arcemusa',
          'https://instagram.com/arcemusa',
          'https://linkedin.com/company/arcemusa'
        ]}
        address={{
          streetAddress: '123 Construction Way',
          addressLocality: 'Building City',
          addressRegion: 'CA',
          postalCode: '90210',
          addressCountry: 'US'
        }}
        telephone="+1-555-123-4567"
        email="info@arcemusa.com"
        priceRange="$$$"
        openingHours={[
          'Monday-Friday 08:00-17:00',
          'Saturday 09:00-15:00'
        ]}
        geo={{
          latitude: 34.0522,
          longitude: -118.2437
        }}
      />
    </>
  );
};

export default HomeSeo;