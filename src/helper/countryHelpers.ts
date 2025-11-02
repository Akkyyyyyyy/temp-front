// src/lib/countryHelpers.ts

export interface Country {
  code: string;
  name?: string; // Optional: you can add country names later
}

// Cache for countries to avoid multiple API calls
let countriesCache: Country[] | null = null;

export const fetchCountries = async (): Promise<Country[]> => {
  // Return cached countries if available
  if (countriesCache) {
    return countriesCache;
  }

  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd');
    const data = await response.json();

    const countryCodeSet = new Set<string>();

    data.forEach((country: any) => {
      if (country.idd?.root && country.idd?.suffixes) {
        // Handle countries with multiple suffixes
        country.idd.suffixes.forEach((suffix: string) => {
          const callingCode = `${country.idd.root}${suffix}`;
          // Filter out invalid or very long codes and add to Set (automatically removes duplicates)
          if (callingCode.length <= 5 && callingCode !== '+') {
            countryCodeSet.add(callingCode);
          }
        });
      } else if (country.idd?.root) {
        // For countries without suffixes
        const callingCode = country.idd.root;
        if (callingCode.length <= 5 && callingCode !== '+') {
          countryCodeSet.add(callingCode);
        }
      }
    });

    // Convert Set to array to ensure uniqueness
    const uniqueCodes = Array.from(countryCodeSet);

    // Create country objects and sort
    const sortedCountries = uniqueCodes
      .map(code => ({ code }))
      .sort((a, b) => {
        // Priority sorting: +1 first, then +44, then others numerically
        if (a.code === "+1") return -1;
        if (b.code === "+1") return 1;
        if (a.code === "+44") return -1;
        if (b.code === "+44") return 1;

        // Sort other codes numerically by converting to numbers
        const numA = parseInt(a.code.replace('+', '')) || 0;
        const numB = parseInt(b.code.replace('+', '')) || 0;
        return numA - numB;
      });
    
    // Cache the result
    countriesCache = sortedCountries;
    return sortedCountries;
  } catch (error) {
    console.error("Failed to fetch countries:", error);
    // Fallback to common country codes if API fails
    const fallbackCountries = getCommonCountryCodes();
    countriesCache = fallbackCountries;
    return fallbackCountries;
  }
};

// Fallback common country codes with proper sorting and uniqueness
const getCommonCountryCodes = (): Country[] => {
  const commonCodes = [
    "+1", "+44", "+91", "+61", "+49", "+33", "+81", "+86",
    "+55", "+7", "+34", "+39", "+82", "+52", "+27"
  ];

  // Remove duplicates and sort
  const uniqueCodes = [...new Set(commonCodes)]
    .map(code => ({ code }))
    .sort((a, b) => {
      if (a.code === "+1") return -1;
      if (b.code === "+1") return 1;
      if (a.code === "+44") return -1;
      if (b.code === "+44") return 1;

      const numA = parseInt(a.code.replace('+', '')) || 0;
      const numB = parseInt(b.code.replace('+', '')) || 0;
      return numA - numB;
    });

  return uniqueCodes;
};

// Function to preload countries (call this on app startup)
export const preloadCountries = async (): Promise<void> => {
  try {
    await fetchCountries();
    console.log("Countries preloaded successfully");
  } catch (error) {
    console.error("Failed to preload countries:", error);
  }
};

// Function to get countries from cache (sync)
export const getCachedCountries = (): Country[] => {
  if (!countriesCache) {
    return getCommonCountryCodes();
  }
  return countriesCache;
};

// Function to clear cache (useful for testing or reloading)
export const clearCountriesCache = (): void => {
  countriesCache = null;
};