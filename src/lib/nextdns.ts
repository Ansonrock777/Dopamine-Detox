/**
 * NextDNS API Client
 * 
 * Handles all interactions with the NextDNS API for managing
 * profiles, blocked domains, and category filtering.
 */

interface _NextDNSConfig {
  apiKey: string;
  profileId: string;
}

interface NextDNSProfile {
  id: string;
  fingerprint?: string;
  name: string;
  setup?: any;
  security?: any;
  privacy?: any;
  parentalControl: {
    safeSearch: boolean;
    youtubeRestrictedMode: boolean;
    blockBypass: boolean;
    services: string[];
    categories: { id: string; active: boolean }[];
    recreation?: any;
  };
  settings?: any;
  denylist: { id: string; active: boolean }[];
  allowlist: string[];
  rewrites?: any[];
}

interface NextDNSCategory {
  id: string;
  name: string;
  description?: string;
}

interface NextDNSService {
  id: string;
  name: string;
  website?: string;
}

export class NextDNSClient {
  private apiKey: string;
  private baseUrl = 'https://api.nextdns.io';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('NextDNS API Request:', {
      url,
      method: options.method || 'GET',
      headers: {
        'X-Api-Key': this.apiKey.substring(0, 8) + '...',
        'Content-Type': 'application/json',
      }
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('NextDNS API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Get response text first to debug
    const responseText = await response.text();
    console.log('NextDNS API Response Body:', responseText);

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
      } catch {
        errorMessage = responseText || 'Unknown error';
      }
      // Include endpoint in error for easier debugging
      throw new Error(`NextDNS API Error (${response.status}) on ${endpoint}: ${errorMessage}`);
    }

    // Handle empty responses (common for 204 No Content)
    if (!responseText || responseText.trim() === '') {
      return {}; // Return empty object for successful operations with no content
    }

    // Try to parse JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse NextDNS response as JSON:', parseError);
      console.error('Response text was:', responseText);
      throw new Error(`Invalid JSON response from NextDNS API: ${responseText}`);
    }
  }

  // Profile Management
  async getProfiles(): Promise<NextDNSProfile[]> {
    const response = await this.request<{ data: NextDNSProfile[] }>('/profiles');
    return response.data;
  }

  async getProfile(profileId: string): Promise<NextDNSProfile> {
    const response = await this.request<{data: NextDNSProfile}>(`/profiles/${profileId}`);
    // NextDNS returns profiles wrapped in a "data" object
    return response.data || response as NextDNSProfile;
  }

  async createProfile(name: string): Promise<NextDNSProfile> {
    return this.request<NextDNSProfile>('/profiles', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async updateProfile(profileId: string, config: Partial<NextDNSProfile['configuration']>): Promise<NextDNSProfile> {
    return this.request<NextDNSProfile>(`/profiles/${profileId}`, {
      method: 'PATCH',
      body: JSON.stringify(config),
    });
  }

  // Domain Management
  async getDenylist(profileId: string): Promise<string[]> {
    const response = await this.request<{ data: string[] }>(`/profiles/${profileId}/denylist`);
    return response.data;
  }

  async addToDenylist(profileId: string, domain: string): Promise<void> {
    await this.request(`/profiles/${profileId}/denylist`, {
      method: 'POST',
      body: JSON.stringify({ id: domain }),
    });
    // Note: NextDNS returns 204 (No Content) for successful additions
  }

  async removeFromDenylist(profileId: string, domain: string): Promise<void> {
    try {
      await this.request(`/profiles/${profileId}/denylist/${domain}`, {
        method: 'DELETE',
      });
    } catch (error) {
      // NextDNS returns 404 when the domain isn't currently on the denylist.
      // Treat this as a no-op so syncs are idempotent.
      if (error instanceof Error && /\(404\)/.test(error.message)) {
        console.warn('NextDNS denylist remove ignored (not found):', domain);
        return;
      }
      throw error;
    }
  }

  async addMultipleToDenylist(profileId: string, domains: string[]): Promise<void> {
    // NextDNS API supports bulk operations
    for (const domain of domains) {
      await this.addToDenylist(profileId, domain);
    }
  }

  async removeMultipleFromDenylist(profileId: string, domains: string[]): Promise<void> {
    for (const domain of domains) {
      await this.removeFromDenylist(profileId, domain);
    }
  }

  // Category Management
  async getAvailableCategories(): Promise<NextDNSCategory[]> {
    // Only the exact categories available in NextDNS (from user's screenshot)
    return [
      { id: 'porn', name: 'Porn' },
      { id: 'gambling', name: 'Gambling' },
      { id: 'dating', name: 'Dating' },
      { id: 'piracy', name: 'Piracy' },
      { id: 'social-networks', name: 'Social Networks' },
      { id: 'gaming', name: 'Online Gaming' }, // Changed from 'online-gaming' to 'gaming'
      { id: 'video-streaming', name: 'Video Streaming' },
    ];
  }

  async getBlockedCategories(profileId: string): Promise<string[]> {
    const profile = await this.getProfile(profileId);
    const categories = profile?.parentalControl?.categories || [];
    // Extract only the IDs of active (blocked) categories
    return categories.filter(cat => cat.active).map(cat => cat.id);
  }

  async blockCategory(profileId: string, categoryId: string): Promise<void> {
    console.log(`🔄 Blocking category ${categoryId} using direct endpoint...`);
    
    // Use direct category endpoint for adding
    await this.request(`/profiles/${profileId}/parentalControl/categories`, {
      method: 'POST',
      body: JSON.stringify({
        id: categoryId,
        active: true
      }),
    });
    
    console.log(`✅ Successfully blocked category ${categoryId}`);
  }

  async unblockCategory(profileId: string, categoryId: string): Promise<void> {
    console.log(`🔄 Unblocking category ${categoryId} using direct endpoint...`);
    
    // Use direct category endpoint for removing
    await this.request(`/profiles/${profileId}/parentalControl/categories/${categoryId}`, {
      method: 'DELETE',
    });
    
    console.log(`✅ Successfully unblocked category ${categoryId}`);
  }

  // Sync all categories in a single request to avoid conflicts
  async syncAllCategories(profileId: string, activeCategories: string[]): Promise<void> {
    console.log('🔄 Starting syncAllCategories with active categories:', activeCategories);
    
    const profile = await this.getProfile(profileId);
    
    // Get the current parental control configuration
    const currentParentalControl = profile?.parentalControl || {};
    console.log('🔍 Current parental control:', JSON.stringify(currentParentalControl, null, 2));
    
    // Get current categories from NextDNS 
    const currentCategories = currentParentalControl.categories || [];
    console.log('🔍 Current categories from NextDNS:', currentCategories);
    
    // Get all available categories from our system
    const availableCategories = await this.getAvailableCategories();
    const availableCategoryIds = availableCategories.map(cat => cat.id);
    console.log('🔍 Available categories in our system:', availableCategoryIds);
    
    // Keep existing categories that are not in our managed list (preserve third-party categories)
    const existingOtherCategories = currentCategories.filter(cat => 
      !availableCategoryIds.includes(cat.id)
    );
    console.log('🔍 Existing other categories to preserve:', existingOtherCategories);
    
    // Create our managed categories with proper active/inactive status
    const managedCategories = availableCategories.map(cat => ({
      id: cat.id,
      active: activeCategories.includes(cat.id)
    }));
    console.log('🔍 Managed categories to set:', managedCategories);

    // Combine existing other categories with our managed ones
    const allCategories = [...existingOtherCategories, ...managedCategories];

    console.log('🔄 Final categories array to send:', {
      total: allCategories.length,
      managed: managedCategories.length,
      existing: existingOtherCategories.length,
      active: allCategories.filter(c => c.active).length,
      activeList: allCategories.filter(c => c.active).map(c => c.id),
      fullArray: allCategories
    });

    // Create the complete parental control object
    const updatedParentalControl = {
      ...currentParentalControl,
      categories: allCategories,
    };

    console.log('🔄 Final parental control payload:', JSON.stringify(updatedParentalControl, null, 2));

    // Update the complete parentalControl configuration
    await this.request(`/profiles/${profileId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        parentalControl: updatedParentalControl,
      }),
    });

    console.log('✅ Categories sync completed successfully');
  }

  // Service Management (specific apps/services)
  async getAvailableServices(): Promise<NextDNSService[]> {
    // Common services that NextDNS can block
    return [
      { id: 'tiktok', name: 'TikTok', website: 'tiktok.com' },
      { id: 'facebook', name: 'Facebook', website: 'facebook.com' },
      { id: 'instagram', name: 'Instagram', website: 'instagram.com' },
      { id: 'twitter', name: 'Twitter/X', website: 'twitter.com' },
      { id: 'youtube', name: 'YouTube', website: 'youtube.com' },
      { id: 'reddit', name: 'Reddit', website: 'reddit.com' },
      { id: 'whatsapp', name: 'WhatsApp', website: 'whatsapp.com' },
      { id: 'messenger', name: 'Messenger', website: 'messenger.com' },
      { id: 'telegram', name: 'Telegram', website: 'telegram.org' },
      { id: 'discord', name: 'Discord', website: 'discord.com' },
      { id: 'snapchat', name: 'Snapchat', website: 'snapchat.com' },
      { id: 'netflix', name: 'Netflix', website: 'netflix.com' },
      { id: 'disneyplus', name: 'Disney+', website: 'disneyplus.com' },
      { id: 'amazonprime', name: 'Amazon Prime', website: 'primevideo.com' },
      { id: 'hulu', name: 'Hulu', website: 'hulu.com' },
    ];
  }

  async getBlockedServices(profileId: string): Promise<string[]> {
    const profile = await this.getProfile(profileId);
    return profile?.configuration?.parentalControl?.services || [];
  }

  async blockService(profileId: string, serviceId: string): Promise<void> {
    const profile = await this.getProfile(profileId);
    
    // Get the current parental control configuration
    const currentParentalControl = profile?.configuration?.parentalControl || {};
    
    // Get current services and add the new one
    const services = [...(currentParentalControl.services || [])];
    if (!services.includes(serviceId)) {
      services.push(serviceId);
    }

    // Update only the parentalControl configuration
    await this.request(`/profiles/${profileId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        parentalControl: {
          ...currentParentalControl,
          services,
        },
      }),
    });
  }

  async unblockService(profileId: string, serviceId: string): Promise<void> {
    const profile = await this.getProfile(profileId);
    
    // Get the current parental control configuration
    const currentParentalControl = profile?.configuration?.parentalControl || {};
    
    // Get current services and remove the specified one
    const services = [...(currentParentalControl.services || [])];
    const index = services.indexOf(serviceId);
    if (index > -1) {
      services.splice(index, 1);
    }

    // Update only the parentalControl configuration
    await this.request(`/profiles/${profileId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        parentalControl: {
          ...currentParentalControl,
          services,
        },
      }),
    });
  }

  // Sync Operations
  async syncUserBlocking(
    profileId: string, 
    domains: string[], 
    categories: string[], 
    services: string[]
  ): Promise<void> {
    try {
      console.log('🔄 NextDNS sync starting for profile:', profileId)
      console.log('📊 Sync data:', {
        domains: domains.length,
        categories: categories.length,
        services: services.length
      })

      // Validate categories against available ones
      const availableCategories = await this.getAvailableCategories()
      const availableCategoryIds = availableCategories.map(c => c.id)
      const invalidCategories = categories.filter(c => !availableCategoryIds.includes(c))
      
      if (invalidCategories.length > 0) {
        console.warn('⚠️ Invalid categories detected:', invalidCategories)
        console.log('✅ Valid categories:', availableCategoryIds)
        // Filter out invalid categories instead of failing
        categories = categories.filter(c => availableCategoryIds.includes(c))
        console.log('🔧 Filtered to valid categories:', categories)
      }

      // Get current state
      console.log('📥 Fetching current NextDNS state...')
      const [currentDenylist, currentCategories, currentServices] = await Promise.all([
        this.getDenylist(profileId),
        this.getBlockedCategories(profileId),
        this.getBlockedServices(profileId),
      ]);

      console.log('📊 Current NextDNS state:', {
        currentDenylist: currentDenylist.length,
        currentCategories: currentCategories.length,
        currentServices: currentServices.length
      })

      // Sync domains
      const domainsToAdd = domains.filter(d => d && d.trim() && !currentDenylist.includes(d))
      const domainsToRemove = currentDenylist.filter(d => !domains.includes(d))

      console.log('🌐 Domain changes:', {
        toAdd: domainsToAdd.length,
        toRemove: domainsToRemove.length,
        addList: domainsToAdd,
        removeList: domainsToRemove
      })

      if (domainsToAdd.length > 0 || domainsToRemove.length > 0) {
        await Promise.all([
          ...domainsToAdd.map(d => this.addToDenylist(profileId, d)),
          ...domainsToRemove.map(d => this.removeFromDenylist(profileId, d)),
        ]);
        console.log('✅ Domain sync completed')
      } else {
        console.log('✅ No domain changes needed')
      }

      // Sync categories
      const categoriesToAdd = categories.filter(c => !currentCategories.includes(c))
      const categoriesToRemove = currentCategories.filter(c => !categories.includes(c))

      console.log('🛡️ Category changes:', {
        toAdd: categoriesToAdd.length,
        toRemove: categoriesToRemove.length,
        addList: categoriesToAdd,
        removeList: categoriesToRemove
      })

      if (categoriesToAdd.length > 0 || categoriesToRemove.length > 0) {
        // Process categories individually to avoid conflicts
        console.log('🔄 Processing individual category changes...')
        
        for (const categoryId of categoriesToAdd) {
          try {
            console.log(`🔄 Adding category: ${categoryId}`)
            await this.blockCategory(profileId, categoryId)
            console.log(`✅ Successfully added category: ${categoryId}`)
          } catch (error) {
            console.error(`❌ Failed to add category ${categoryId}:`, error)
            // Continue with other categories even if one fails
          }
        }
        
        for (const categoryId of categoriesToRemove) {
          try {
            console.log(`🔄 Removing category: ${categoryId}`)
            await this.unblockCategory(profileId, categoryId)
            console.log(`✅ Successfully removed category: ${categoryId}`)
          } catch (error) {
            console.error(`❌ Failed to remove category ${categoryId}:`, error)
            // Continue with other categories even if one fails
          }
        }
        
        console.log('✅ Individual category sync completed')
      } else {
        console.log('✅ No category changes needed')
      }

      // Sync services
      const servicesToAdd = services.filter(s => !currentServices.includes(s))
      const servicesToRemove = currentServices.filter(s => !services.includes(s))

      console.log('⚙️ Service changes:', {
        toAdd: servicesToAdd.length,
        toRemove: servicesToRemove.length
      })

      if (servicesToAdd.length > 0 || servicesToRemove.length > 0) {
        await Promise.all([
          ...servicesToAdd.map(s => this.blockService(profileId, s)),
          ...servicesToRemove.map(s => this.unblockService(profileId, s)),
        ]);
        console.log('✅ Service sync completed')
      } else {
        console.log('✅ No service changes needed')
      }

      console.log('🎉 NextDNS sync completed successfully for profile:', profileId)
    } catch (error) {
      console.error('❌ NextDNS sync failed:', error);
      throw error;
    }
  }

  // Analytics (if available)
  async getAnalytics(profileId: string, from?: Date, to?: Date): Promise<unknown> {
    const params = new URLSearchParams();
    if (from) params.append('from', from.toISOString());
    if (to) params.append('to', to.toISOString());
    
    const queryString = params.toString();
    const endpoint = `/profiles/${profileId}/logs${queryString ? `?${queryString}` : ''}`;
    
    try {
      return await this.request(endpoint);
    } catch (error) {
      console.warn('NextDNS analytics not available:', error);
      return null;
    }
  }
}

// Utility functions
export function validateNextDNSApiKey(apiKey: string): boolean {
  // NextDNS API keys are typically 40-character hexadecimal strings
  return /^[a-fA-F0-9]{40}$/.test(apiKey);
}

export function extractDomainFromUrl(url: string): string {
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    // If URL parsing fails, assume it's already a domain
    return url.replace(/^www\./, '');
  }
}

export async function testNextDNSConnection(apiKey: string): Promise<boolean> {
  try {
    const client = new NextDNSClient(apiKey);
    const profiles = await client.getProfiles();
    console.log('NextDNS connection test successful, found profiles:', profiles.length);
    return true;
  } catch (error) {
    console.error('NextDNS connection test failed:', error);
    throw error; // Re-throw to get better error messages in the UI
  }
}