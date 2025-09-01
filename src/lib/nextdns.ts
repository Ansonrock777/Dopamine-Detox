/**
 * NextDNS API Client
 * 
 * Handles all interactions with the NextDNS API for managing
 * profiles, blocked domains, and category filtering.
 */

// Configuration interface for NextDNS API
export interface NextDNSConfig {
  apiKey: string;
  profileId: string;
}

interface NextDNSProfile {
  id: string;
  fingerprint?: string;
  name: string;
  setup?: unknown;
  security?: unknown;
  privacy?: unknown;
  parentalControl: {
    safeSearch: boolean;
    youtubeRestrictedMode: boolean;
    blockBypass: boolean;
    services: string[];
    categories: { id: string; active: boolean }[];
    recreation?: unknown;
  };
  settings?: unknown;
  denylist: { id: string; active: boolean }[];
  allowlist: string[];
  rewrites?: unknown[];
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

interface NextDNSProfileConfig {
  endpoint_id: string;
  dns_server_primary: string;
  dns_server_secondary: string;
  dns_over_tls: string;
  dns_over_https: string;
  ipv6_address_1: string;
  ipv6_address_2: string;
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
    
    console.log('🌐 NextDNS API Request:', {
      url,
      method: options.method || 'GET',
      headers: {
        'X-Api-Key': this.apiKey.substring(0, 8) + '...',
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.parse(options.body as string) : undefined
    });

    // Add timeout and retry logic for 524 errors
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      // Handle 524 timeout errors specifically
      if (response.status === 524) {
        console.error('❌ NextDNS API Timeout (524):', {
          status: response.status,
          endpoint,
          message: 'NextDNS server timeout - API may be overloaded'
        });
        throw new Error(`NextDNS API Timeout (524) on ${endpoint}: Server timeout - API may be overloaded`);
      }
      
      return this.handleResponse<T>(response, endpoint);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ NextDNS API Request Timeout:', { endpoint, timeout: '30s' });
        throw new Error(`NextDNS API Request Timeout on ${endpoint}: Request took longer than 30 seconds`);
      }
      
      throw error;
    }
  }

  private async handleResponse<T>(response: Response, endpoint: string): Promise<T> {
    console.log('📡 NextDNS API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Get response text first to debug
    const responseText = await response.text();
    console.log('📄 NextDNS API Response Body:', responseText);

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
      } catch {
        errorMessage = responseText || 'Unknown error';
      }
      // Include endpoint in error for easier debugging
      console.error('❌ NextDNS API Error:', {
        status: response.status,
        endpoint,
        errorMessage,
        fullResponse: responseText
      });
      throw new Error(`NextDNS API Error (${response.status}) on ${endpoint}: ${errorMessage}`);
    }

    // Handle empty responses (common for 204 No Content)
    if (!responseText || responseText.trim() === '') {
      console.log('✅ NextDNS API returned empty response (likely success)');
      return (undefined as unknown) as T
    }

    // Try to parse JSON
    try {
      const parsed = JSON.parse(responseText);
      console.log('✅ NextDNS API parsed response:', parsed);
      return parsed;
    } catch (parseError) {
      console.error('❌ Failed to parse NextDNS response as JSON:', parseError);
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
    const response = await this.request<{data: NextDNSProfile} | NextDNSProfile>(`/profiles/${profileId}`);
    // If the response has a data field, use it. Otherwise assume it's the profile directly.
    if (typeof (response as unknown as { data?: NextDNSProfile }).data !== 'undefined') {
      return (response as { data: NextDNSProfile }).data
    }
    return response as NextDNSProfile
  }

  async createProfile(name: string): Promise<NextDNSProfile> {
    console.log(`🔄 NextDNS createProfile: Making API call with name "${name}"`)
    
    const response = await this.request<{ data: NextDNSProfile } | NextDNSProfile>('/profiles', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    
    console.log(`🔍 NextDNS createProfile raw response:`, JSON.stringify(response, null, 2))
    
    // Some NextDNS endpoints return the object directly, others wrap it in { data }
    let profile: NextDNSProfile
    if (typeof (response as unknown as { data?: NextDNSProfile }).data !== 'undefined') {
      profile = (response as { data: NextDNSProfile }).data;
      console.log(`🔍 NextDNS createProfile extracted from .data:`, JSON.stringify(profile, null, 2))
    } else {
      profile = response as NextDNSProfile;
      console.log(`🔍 NextDNS createProfile using direct response:`, JSON.stringify(profile, null, 2))
    }
    
    if (!profile || typeof profile !== 'object') {
      throw new Error(`Invalid profile response from NextDNS API: ${JSON.stringify(response)}`)
    }
    
    if (!profile.id) {
      throw new Error(`NextDNS API returned profile without ID: ${JSON.stringify(profile)}`)
    }
    
    console.log(`✅ NextDNS createProfile successful, ID: ${profile.id}`)
    return profile;
  }

  async updateProfile(profileId: string, config: Partial<NextDNSProfile>): Promise<NextDNSProfile> {
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
    console.log(`🔄 Blocking category ${categoryId} on profile ${profileId}...`);
    
    try {
      // Get current profile to read existing categories
      const profile = await this.getProfile(profileId);
      const currentParentalControl = profile?.parentalControl || {};
      const currentCategories = currentParentalControl.categories || [];
      
      // Check if category is already active
      const existingCategory = currentCategories.find(cat => cat.id === categoryId);
      if (existingCategory?.active) {
        console.log(`✅ Category ${categoryId} already blocked, no changes needed`);
        return;
      }
      
      // Create a minimal update with just the categories that need to change
      // Keep existing categories and only add/update the target category
      const updatedCategories = currentCategories.filter(cat => cat.id !== categoryId);
      updatedCategories.push({ id: categoryId, active: true });
      
      // Minimal parental control update
      const minimalUpdate = {
        categories: updatedCategories,
        // Keep essential fields to avoid API issues
        safeSearch: currentParentalControl.safeSearch || false,
        youtubeRestrictedMode: currentParentalControl.youtubeRestrictedMode || false,
        blockBypass: currentParentalControl.blockBypass || false,
        services: currentParentalControl.services || []
      };
      
      console.log(`🔄 Updating categories: adding ${categoryId} as blocked`);
      await this.request(`/profiles/${profileId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          parentalControl: minimalUpdate
        }),
      });
      
      console.log(`✅ Successfully blocked category ${categoryId}`);
    } catch (error) {
      console.error(`❌ Error blocking category ${categoryId}:`, error);
      
      // If the individual update fails, provide better error info
      if (error instanceof Error && error.message.includes('500')) {
        console.error(`❌ NextDNS API returned server error for category ${categoryId}. This might be due to rate limiting or API issues.`);
      }
      
      throw error;
    }
  }

  async unblockCategory(profileId: string, categoryId: string): Promise<void> {
    console.log(`🔄 Unblocking category ${categoryId} on profile ${profileId}...`);
    
    try {
      // Get current profile to read existing categories
      const profile = await this.getProfile(profileId);
      const currentParentalControl = profile?.parentalControl || {};
      const currentCategories = currentParentalControl.categories || [];
      
      // Check if category exists and is active
      const existingCategory = currentCategories.find(cat => cat.id === categoryId);
      if (!existingCategory || !existingCategory.active) {
        console.log(`✅ Category ${categoryId} already unblocked, no changes needed`);
        return;
      }
      
      // Set the specific category to inactive
      const updatedCategories = currentCategories.map(cat => 
        cat.id === categoryId ? { ...cat, active: false } : cat
      );
      
      // Minimal parental control update
      const minimalUpdate = {
        categories: updatedCategories,
        // Keep essential fields to avoid API issues
        safeSearch: currentParentalControl.safeSearch || false,
        youtubeRestrictedMode: currentParentalControl.youtubeRestrictedMode || false,
        blockBypass: currentParentalControl.blockBypass || false,
        services: currentParentalControl.services || []
      };
      
      console.log(`🔄 Updating categories: setting ${categoryId} as unblocked`);
      await this.request(`/profiles/${profileId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          parentalControl: minimalUpdate
        }),
      });
      
      console.log(`✅ Successfully unblocked category ${categoryId}`);
    } catch (error) {
      console.error(`❌ Error unblocking category ${categoryId}:`, error);
      
      // If the individual update fails, provide better error info
      if (error instanceof Error && error.message.includes('500')) {
        console.error(`❌ NextDNS API returned server error for category ${categoryId}. This might be due to rate limiting or API issues.`);
      }
      
      throw error;
    }
  }

  // Sync all categories in a single request to avoid conflicts
  async syncAllCategories(profileId: string, activeCategories: string[]): Promise<void> {
    console.log('🔄 Starting syncAllCategories with active categories:', activeCategories);
    
    try {
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

      // Create a clean parental control object with only essential fields
      const cleanParentalControl = {
        safeSearch: currentParentalControl.safeSearch || false,
        youtubeRestrictedMode: currentParentalControl.youtubeRestrictedMode || false,
        blockBypass: currentParentalControl.blockBypass || false,
        services: currentParentalControl.services || [],
        categories: allCategories,
        // Only include recreation if it exists and is not empty
        ...(currentParentalControl.recreation && Object.keys(currentParentalControl.recreation).length > 0 
          ? { recreation: currentParentalControl.recreation } 
          : {})
      };

      console.log('🔄 Clean parental control payload:', JSON.stringify(cleanParentalControl, null, 2));

      // Try the update with retry logic for 500 errors
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await this.request(`/profiles/${profileId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              parentalControl: cleanParentalControl,
            }),
          });
          
          console.log('✅ Categories sync completed successfully');
          return;
        } catch (error) {
          retryCount++;
          
          if (error instanceof Error && error.message.includes('500') && retryCount < maxRetries) {
            console.warn(`⚠️ Attempt ${retryCount} failed with 500 error, retrying in ${retryCount * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
            continue;
          }
          
          // If it's still failing after retries, try a simpler approach
          if (retryCount >= maxRetries && error instanceof Error && error.message.includes('500')) {
            console.warn('⚠️ Full sync failed, trying individual category updates...');
            await this.syncCategoriesIndividually(profileId, activeCategories);
            return;
          }
          
          throw error;
        }
      }
    } catch (error) {
      console.error('❌ Error in syncAllCategories:', error);
      throw error;
    }
  }

  // Fallback method to sync categories individually
  private async syncCategoriesIndividually(profileId: string, activeCategories: string[]): Promise<void> {
    console.log('🔄 Syncing categories individually as fallback...');
    
    try {
      const availableCategories = await this.getAvailableCategories();
      const profile = await this.getProfile(profileId);
      const currentCategories = profile?.parentalControl?.categories || [];
      
      // Get currently active categories
      const currentlyActive = currentCategories
        .filter(cat => cat.active)
        .map(cat => cat.id);
      
      // Categories to activate
      const toActivate = activeCategories.filter(cat => !currentlyActive.includes(cat));
      // Categories to deactivate (only our managed ones)
      const managedCategoryIds = availableCategories.map(cat => cat.id);
      const toDeactivate = currentlyActive.filter(cat => 
        managedCategoryIds.includes(cat) && !activeCategories.includes(cat)
      );
      
      console.log('🔄 Individual sync plan:', { toActivate, toDeactivate });
      
      // Activate categories one by one
      for (const categoryId of toActivate) {
        try {
          await this.blockCategory(profileId, categoryId);
          console.log(`✅ Individually activated: ${categoryId}`);
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`❌ Failed to activate ${categoryId}:`, error);
        }
      }
      
      // Deactivate categories one by one
      for (const categoryId of toDeactivate) {
        try {
          await this.unblockCategory(profileId, categoryId);
          console.log(`✅ Individually deactivated: ${categoryId}`);
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`❌ Failed to deactivate ${categoryId}:`, error);
        }
      }
      
      console.log('✅ Individual category sync completed');
    } catch (error) {
      console.error('❌ Individual category sync failed:', error);
      throw error;
    }
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
    return profile?.parentalControl?.services || [];
  }

  async blockService(profileId: string, serviceId: string): Promise<void> {
    const profile = await this.getProfile(profileId);
    
    // Get the current parental control configuration
    const currentParentalControl = profile?.parentalControl || {};
    
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
    const currentParentalControl = profile?.parentalControl || {};
    
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

  // Get actual profile configuration from NextDNS API
  async getProfileConfig(profileId: string): Promise<NextDNSProfileConfig> {
    console.log('🔍 Getting profile config for profileId:', profileId);
    
    // For dev profiles that map to real profiles, use the endpoint from the config
    let endpointId: string;
    
    if (profileId.startsWith('dev-profile-')) {
      // This is a development profile that maps to a real NextDNS profile
      // The real endpoint should be derived from the profile configuration
      endpointId = '81fdf8'; // This should match your actual NextDNS profile endpoint
      console.log('🔍 Development profile detected, using real endpoint:', endpointId);
    } else if (profileId.length === 6 && /^[a-f0-9]+$/.test(profileId)) {
      // This looks like a real NextDNS endpoint ID
      endpointId = profileId;
      console.log('🔍 Real NextDNS endpoint detected:', endpointId);
    } else {
      // Try to get the actual profile from NextDNS API
      try {
        const profile = await this.getProfile(profileId);
        // Extract endpoint from profile if available
        endpointId = profile.id || profileId;
        console.log('🔍 Retrieved endpoint from API:', endpointId);
      } catch {
        console.warn('🔍 Could not get profile from API, using profileId as-is:', profileId);
        endpointId = profileId;
      }
    }
    
    const config = {
      endpoint_id: endpointId,
      dns_server_primary: '45.90.28.240',
      dns_server_secondary: '45.90.30.240',
      dns_over_tls: `${endpointId}.dns.nextdns.io`,
      dns_over_https: `https://dns.nextdns.io/${endpointId}`,
      ipv6_address_1: `2a07:a8c0::${endpointId}`,
      ipv6_address_2: `2a07:a8c1::${endpointId}`,
    };
    
    console.log('🔍 Final config generated:', config);
    return config;
  }

  // Generate profile configuration data based on profile ID (fallback)
  generateProfileConfig(profileId: string): NextDNSProfileConfig {
    console.log('🔍 Generating profile config for profileId:', profileId);
    
    let endpointId: string;
    
    if (profileId.startsWith('dev-profile-')) {
      // Development profile - use the real endpoint
      endpointId = '81fdf8';
      console.log('🔍 Development profile, using real endpoint:', endpointId);
    } else if (profileId.length === 6 && /^[a-f0-9]+$/.test(profileId)) {
      // Already looks like a real endpoint
      endpointId = profileId;
      console.log('🔍 Using provided endpoint:', endpointId);
    } else {
      // Default fallback
      endpointId = '81fdf8';
      console.log('🔍 Using default endpoint:', endpointId);
    }
    
    const config = {
      endpoint_id: endpointId,
      dns_server_primary: '45.90.28.240',
      dns_server_secondary: '45.90.30.240',
      dns_over_tls: `${endpointId}.dns.nextdns.io`,
      dns_over_https: `https://dns.nextdns.io/${endpointId}`,
      ipv6_address_1: `2a07:a8c0::${endpointId}`,
      ipv6_address_2: `2a07:a8c1::${endpointId}`,
    };
    
    console.log('🔍 Generated config:', config);
    return config;
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