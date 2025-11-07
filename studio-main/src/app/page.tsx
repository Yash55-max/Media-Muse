'use client';

import { useState } from 'react';
import { Music, Quote } from 'lucide-react';
import { Header } from '@/components/media-muse/Header';
import { ImageUploader } from '@/components/media-muse/ImageUploader';
import { SuggestionCard } from '@/components/media-muse/SuggestionCard';
import { getCaption, getMusicSuggestion } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [musicSuggestion, setMusicSuggestion] = useState<{ songTitle: string; spotifyUrl: string } | null>(null);
  const [isCaptionLoading, setIsCaptionLoading] = useState(false);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = (dataUri: string) => {
    setImageDataUri(dataUri);
    setCaption(null);
    setMusicSuggestion(null);
  };
  
  const handleClear = () => {
    setImageDataUri(null);
    setCaption(null);
    setMusicSuggestion(null);
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
    const result = await getMusicSuggestion(imageDataUri);
    if ('songTitle' in result) {
      setMusicSuggestion(result);
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
          <div className="lg:col-span-3">
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
