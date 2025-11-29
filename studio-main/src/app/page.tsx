'use client';

import { useState, useEffect, useMemo } from 'react';
import { Music, Quote, MapPin, Loader2, Languages } from 'lucide-react';
import { Header } from '@/components/media-muse/Header';
import { ImageUploader } from '@/components/media-muse/ImageUploader';
import { SuggestionCard } from '@/components/media-muse/SuggestionCard';
import { getCaption, getMusicSuggestion } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function Home() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [musicSuggestion, setMusicSuggestion] = useState<{ songTitle: string; spotifyUrl: string } | null>(null);
  const [isCaptionLoading, setIsCaptionLoading] = useState(false);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [languagePreference, setLanguagePreference] = useState<string>('');
  const [suggestedSongs, setSuggestedSongs] = useState<string[]>([]); // Track suggested songs
  const { toast } = useToast();

  // Get available language options based on location
  const availableLanguages = useMemo(() => {
    const southIndianStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Puducherry', 'South India'];
    const isSouthIndia = southIndianStates.some(s => location.includes(s));

    if (location.includes('Tamil Nadu')) {
      return [
        { value: 'tamil', label: 'Tamil' },
        { value: 'telugu', label: 'Telugu' },
        { value: 'english', label: 'English' },
        { value: 'hindi', label: 'Hindi' },
      ];
    } else if (location.includes('Kerala')) {
      return [
        { value: 'malayalam', label: 'Malayalam' },
        { value: 'tamil', label: 'Tamil' },
        { value: 'english', label: 'English' },
        { value: 'hindi', label: 'Hindi' },
      ];
    } else if (location.includes('Karnataka')) {
      return [
        { value: 'kannada', label: 'Kannada' },
        { value: 'tamil', label: 'Tamil' },
        { value: 'english', label: 'English' },
        { value: 'hindi', label: 'Hindi' },
      ];
    } else if (location.includes('Andhra Pradesh') || location.includes('Telangana')) {
      return [
        { value: 'telugu', label: 'Telugu' },
        { value: 'tamil', label: 'Tamil' },
        { value: 'english', label: 'English' },
        { value: 'hindi', label: 'Hindi' },
      ];
    } else if (isSouthIndia) {
      return [
        { value: 'tamil', label: 'Tamil' },
        { value: 'telugu', label: 'Telugu' },
        { value: 'malayalam', label: 'Malayalam' },
        { value: 'kannada', label: 'Kannada' },
        { value: 'english', label: 'English' },
        { value: 'hindi', label: 'Hindi' },
      ];
    } else if (location.includes('India')) {
      return [
        { value: 'hindi', label: 'Hindi' },
        { value: 'english', label: 'English' },
        { value: 'tamil', label: 'Tamil' },
        { value: 'telugu', label: 'Telugu' },
        { value: 'punjabi', label: 'Punjabi' },
        { value: 'bengali', label: 'Bengali' },
      ];
    } else {
      return [
        { value: 'english', label: 'English' },
        { value: 'spanish', label: 'Spanish' },
        { value: 'french', label: 'French' },
        { value: 'korean', label: 'Korean (K-pop)' },
        { value: 'japanese', label: 'Japanese (J-pop)' },
      ];
    }
  }, [location]);

  // Auto-select first language when location changes
  useEffect(() => {
    if (availableLanguages.length > 0 && !languagePreference) {
      setLanguagePreference(availableLanguages[0].value);
    }
  }, [availableLanguages, languagePreference]);

  // Automatically detect user location on component mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setIsLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocation('India'); // Fallback
      setIsLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use reverse geocoding to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'MediaMuse/1.0', // Required by Nominatim
              },
            }
          );

          const data = await response.json();

          // Extract state/region information
          const state = data.address?.state || data.address?.region || '';
          const country = data.address?.country || '';

          // Determine if it's a South Indian state
          const southIndianStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Puducherry'];
          const isSouthIndia = southIndianStates.some(s => state.includes(s));

          let detectedLocation = '';
          if (isSouthIndia) {
            detectedLocation = state || 'South India';
          } else if (country === 'India') {
            detectedLocation = state || 'India';
          } else {
            detectedLocation = country || 'Global';
          }

          setLocation(detectedLocation);

          toast({
            title: 'Location Detected',
            description: `Your location: ${detectedLocation}`,
          });
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setLocationError('Could not determine location name');
          setLocation('India'); // Fallback
        }

        setIsLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Location access denied';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Using default location.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }

        setLocationError(errorMessage);
        setLocation('South India'); // Default fallback
        setIsLocationLoading(false);

        toast({
          variant: 'destructive',
          title: 'Location Detection Failed',
          description: errorMessage,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleImageUpload = (dataUri: string) => {
    setImageDataUri(dataUri);
    setCaption(null);
    setMusicSuggestion(null);
    setSuggestedSongs([]); // Clear suggested songs history for new image
  };

  const handleClear = () => {
    setImageDataUri(null);
    setCaption(null);
    setMusicSuggestion(null);
    setSuggestedSongs([]); // Clear suggested songs history
  };

  const handleGenerateCaption = async () => {
    if (!imageDataUri) return;
    setIsCaptionLoading(true);
    const result = await getCaption(imageDataUri);
    if ('caption' in result) {
      setCaption(result.caption);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
    setIsCaptionLoading(false);
  };

  const handleSuggestMusic = async () => {
    if (!imageDataUri) return;
    setIsMusicLoading(true);
    const locationWithLanguage = languagePreference ? `${location} (${languagePreference} songs)` : location;
    const result = await getMusicSuggestion(imageDataUri, locationWithLanguage);
    if ('songTitle' in result) {
      setMusicSuggestion(result);
      // Add to suggested songs history
      setSuggestedSongs(prev => [...prev, result.songTitle]);

      // Show toast with suggestion count
      toast({
        title: 'New Song Suggested',
        description: `Suggestion #${suggestedSongs.length + 1}: ${result.songTitle}`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
    setIsMusicLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Detected Location</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={detectLocation}
                  disabled={isLocationLoading}
                >
                  {isLocationLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>

              {isLocationLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Detecting your location...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-2 bg-primary/10 text-primary rounded-md font-medium">
                      {location || 'Location not detected'}
                    </div>
                  </div>
                  {locationError && (
                    <p className="text-xs text-destructive">{locationError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Music recommendations will be based on your location
                  </p>
                </div>
              )}
            </div>

            {/* Language Preference Selector */}
            {!isLocationLoading && availableLanguages.length > 0 && (
              <div className="bg-card rounded-lg border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Languages className="w-4 h-4" />
                  <span className="text-sm font-medium">Music Language Preference</span>
                </div>
                <RadioGroup
                  value={languagePreference}
                  onValueChange={setLanguagePreference}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                >
                  {availableLanguages.map((lang) => (
                    <div key={lang.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={lang.value} id={lang.value} />
                      <Label
                        htmlFor={lang.value}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {lang.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-xs text-muted-foreground mt-3">
                  Select your preferred language for song recommendations
                </p>
              </div>
            )}
            <ImageUploader
              onImageUpload={handleImageUpload}
              uploadedImage={imageDataUri}
              onClear={handleClear}
            />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-8">
            <SuggestionCard
              title="Caption"
              Icon={Quote}
              content={caption}
              isLoading={isCaptionLoading}
              onGenerate={handleGenerateCaption}
              showGenerateButton={!!imageDataUri}
            />
            <SuggestionCard
              title="Music"
              Icon={Music}
              content={musicSuggestion}
              isLoading={isMusicLoading}
              onGenerate={handleSuggestMusic}
              showGenerateButton={!!imageDataUri}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
