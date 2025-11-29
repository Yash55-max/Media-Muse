"use server";

import { generateImageCaption } from "@/ai/flows/generate-image-caption";
import { suggestBackgroundMusic } from "@/ai/flows/suggest-background-music";

export async function getCaption(
  photoDataUri: string
): Promise<{ caption: string } | { error: string }> {
  try {
    const result = await generateImageCaption({ photoDataUri });
    return { caption: result.caption };
  } catch (e) {
    console.error(e);
    return { error: "Failed to generate caption. Please try again." };
  }
}

export async function getMusicSuggestion(
  photoDataUri: string,
  location?: string
): Promise<{ songTitle: string; spotifyUrl: string } | { error: string }> {
  try {
    const result = await suggestBackgroundMusic({
      photoDataUri,
      timestamp: Date.now(), // Add timestamp to ensure varied recommendations
      location, // Pass user location for region-specific recommendations
    });
    return { songTitle: result.songTitle, spotifyUrl: result.spotifyUrl };
  } catch (e) {
    console.error(e);
    return { error: "Failed to suggest music. Please try again." };
  }
}
