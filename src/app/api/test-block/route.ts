import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getNextDNSAccount } from '@/lib/nextdns-database';
import { getBlockedWebsites } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const website = searchParams.get('website');
    
    if (!website) {
      return NextResponse.json({ error: 'Website parameter is required' }, { status: 400 });
    }

    // Get user's NextDNS account
    const account = await getNextDNSAccount(userId);
    if (!account) {
      return NextResponse.json({ 
        blocked: false, 
        message: 'NextDNS not configured'
      });
    }

    // Get user's blocked websites
    const blockedSites = await getBlockedWebsites(userId);
    
    // Check if website is in blocked list
    const isExplicitlyBlocked = blockedSites.some(site => 
      site.url === website || website.includes(site.url.replace('www.', ''))
    );

    // Check against common category patterns
    const socialMediaSites = [
      'facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 
      'youtube.com', 'reddit.com', 'snapchat.com', 'pinterest.com'
    ];
    
    const newsSites = [
      'cnn.com', 'bbc.com', 'foxnews.com', 'nytimes.com', 
      'washingtonpost.com', 'reuters.com', 'bloomberg.com'
    ];
    
    const shoppingSites = [
      'amazon.com', 'ebay.com', 'walmart.com', 'target.com',
      'bestbuy.com', 'etsy.com', 'alibaba.com'
    ];

    let categoryBlocked = false;
    let category = '';

    if (socialMediaSites.some(site => website.includes(site.replace('www.', '')))) {
      category = 'social media';
      // In a real implementation, check if social media category is blocked
      categoryBlocked = true; // Placeholder
    } else if (newsSites.some(site => website.includes(site.replace('www.', '')))) {
      category = 'news';
      categoryBlocked = true; // Placeholder
    } else if (shoppingSites.some(site => website.includes(site.replace('www.', '')))) {
      category = 'shopping';
      categoryBlocked = true; // Placeholder
    }

    const blocked = isExplicitlyBlocked || categoryBlocked;
    
    return NextResponse.json({
      blocked,
      website,
      reason: blocked 
        ? (isExplicitlyBlocked ? 'explicitly blocked' : `${category} category blocked`)
        : 'not blocked',
      message: blocked 
        ? `Website is blocked ${isExplicitlyBlocked ? 'individually' : `as part of ${category}`}`
        : 'Website is not blocked'
    });

  } catch (error) {
    console.error('Error testing block:', error);
    return NextResponse.json(
      { error: 'Failed to test website blocking' },
      { status: 500 }
    );
  }
}