'use server';

/**
 * @fileOverview AI flow for suggesting background music for uploaded images.
 *
 * - suggestBackgroundMusic - A function that suggests background music for an image.
 * - SuggestBackgroundMusicInput - The input type for the suggestBackgroundMusic function.
 * - SuggestBackgroundMusicOutput - The return type for the suggestBackgroundMusic function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import SpotifyWebApi from 'spotify-web-api-node';

const SuggestBackgroundMusicInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().optional().describe('Optional description of the image.'),
  timestamp: z.number().optional().describe('Timestamp to ensure varied recommendations.'),
  location: z.string().optional().describe('User location/region for culturally relevant song recommendations (e.g., South India, North India, Tamil Nadu, Kerala, etc.).'),
});
export type SuggestBackgroundMusicInput = z.infer<typeof SuggestBackgroundMusicInputSchema>;

const PromptOutputSchema = z.object({
  songTitle: z.string().describe('The title of the suggested song.'),
});

const SuggestBackgroundMusicOutputSchema = z.object({
  songTitle: z.string().describe('The title of the suggested song.'),
  spotifyUrl: z.string().describe('The Spotify URL for the suggested song.'),
});
export type SuggestBackgroundMusicOutput = z.infer<typeof SuggestBackgroundMusicOutputSchema>;

export async function suggestBackgroundMusic(input: SuggestBackgroundMusicInput): Promise<SuggestBackgroundMusicOutput> {
  return suggestBackgroundMusicFlow(input);
}



const prompt = ai.definePrompt({
  name: 'suggestBackgroundMusicPrompt',
  input: { schema: SuggestBackgroundMusicInputSchema },
  output: { schema: PromptOutputSchema },
  config: {
    temperature: 1.8, // Even higher temperature for maximum variety
  },
  prompt: `You are an AI assistant that suggests trending songs for images based on current online trends and user location preferences.

  Based on the image (and the optional description), suggest ONE suitable trending song that fits the mood or theme of the image.
  
  {% if location %}
  LOCATION PREFERENCE: The user is from {{location}}. 
  
  **IMPORTANT - LANGUAGE & REGIONAL PRIORITY:**
  - If the location contains a language preference (e.g., "Tamil Nadu (tamil songs)", "Kerala (malayalam songs)"), you MUST prioritize songs in that specific language.
  
  - For Telugu songs: Focus on Telugu cinema hits (Tollywood). Examples include:
    * Recent hits: "Butta Bomma", "Samajavaragamana", "Ramuloo Ramulaa", "Oo Antava", "Kaavaalaa" (Telugu version)
    * Classics: "Nuvvostanante Nenoddantana", "Okkadu", "Pokiri" songs
    * Composers: Devi Sri Prasad, Thaman S, S.S. Thaman, M.M. Keeravani, Anirudh (Telugu songs)
    * Artists: Sid Sriram, Armaan Malik, Shreya Ghoshal, Anurag Kulkarni
  
  - For Tamil songs: Focus on Tamil cinema hits, indie Tamil artists, and trending Tamil music. Consider composers like A.R. Rahman, Anirudh Ravichander, Yuvan Shankar Raja, Harris Jayaraj, etc.
  
  - For Malayalam songs: Focus on Malayalam cinema hits (Mollywood). Consider composers like Gopi Sundar, Sushin Shyam, Bijibal, etc.
  
  - For Kannada songs: Focus on Kannada cinema hits (Sandalwood). Consider composers like V. Harikrishna, Arjun Janya, etc.
  
  - For Hindi songs: Focus on Bollywood hits and indie Hindi artists.
  
  - For English songs: Focus on international pop, rock, indie, and trending English music.
  
  - If the location is South India, Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana, or any South Indian region WITHOUT a specific language preference, prioritize South Indian songs across all languages (Tamil, Telugu, Malayalam, Kannada).
  - For other regions, prioritize songs popular in that specific region while maintaining cultural relevance.
  {% else %}
  Since no location is specified, provide diverse recommendations including South Indian songs along with other regional and international music.
  {% endif %}
  
  **CRITICAL - VARIETY REQUIREMENT:**
  This is call number {{timestamp}}. You MUST provide a COMPLETELY DIFFERENT song than any previous suggestions.
  
  To ensure variety, use this approach based on the timestamp:
  - Explore different moods: happy, melancholic, energetic, calm, romantic, adventurous, nostalgic, celebratory
  - Explore different genres: mass masala, romantic, folk fusion, classical fusion, devotional, indie, rock, electronic
  - Explore different eras: 2024-2025 hits, 2020-2023 recent, 2015-2019 modern classics, 2010-2014 classics, pre-2010 timeless
  - Explore different artists and composers - don't repeat the same artist/composer
  - Explore different film industries if applicable (Tollywood, Kollywood, Bollywood, etc.)
  
  Think creatively and suggest songs that fit the image mood but are DISTINCT from what you might have suggested before.
  
  Ensure the song is likely available on major platforms like Spotify. Provide only the song title and artist name in the format: "Song Title - Artist Name".

  {% if description %}
  Description: {{{description}}}
  {% endif %}

  Image: {{media url=photoDataUri}}
  `,
});

async function isVideoAvailable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function searchSpotifyTrack(songTitle: string): Promise<{ songTitle: string; spotifyUrl: string } | null> {
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  try {
    // Get access token
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);

    // Search for the track
    const searchResults = await spotifyApi.searchTracks(songTitle, { limit: 1 });

    const track = searchResults.body.tracks?.items[0];
    if (track) {
      return {
        songTitle: track.name,
        spotifyUrl: track.external_urls.spotify,
      };
    }
  } catch (error) {
    console.error('Error searching Spotify:', error);
  }
  return null;
}

const suggestBackgroundMusicFlow = ai.defineFlow(
  {
    name: 'suggestBackgroundMusicFlow',
    inputSchema: SuggestBackgroundMusicInputSchema,
    outputSchema: SuggestBackgroundMusicOutputSchema,
  },
  async input => {
    console.log('=== Music Suggestion Request ===');
    console.log('Location:', input.location);
    console.log('Timestamp:', input.timestamp);
    console.log('================================');

    for (let i = 0; i < 3; i++) {
      console.log(`\nAttempt ${i + 1}/3:`);
      const { output } = await prompt(input);

      if (output) {
        console.log(`AI suggested: "${output.songTitle}"`);
        const spotifyResult = await searchSpotifyTrack(output.songTitle);

        if (spotifyResult) {
          console.log(`✓ Found on Spotify: "${spotifyResult.songTitle}"`);
          console.log(`  URL: ${spotifyResult.spotifyUrl}`);
          return { songTitle: spotifyResult.songTitle, spotifyUrl: spotifyResult.spotifyUrl };
        } else {
          console.log(`✗ Not found on Spotify, trying again...`);
        }
      } else {
        console.log(`✗ AI did not return a suggestion`);
      }
    }

    // If all attempts fail, return the last suggestion
    console.log('\nAll attempts exhausted, making final attempt...');
    const { output } = await prompt(input);
    console.log(`Final AI suggestion: "${output?.songTitle}"`);
    const spotifyResult = await searchSpotifyTrack(output!.songTitle);

    if (spotifyResult) {
      console.log(`✓ Final result found on Spotify: "${spotifyResult.songTitle}"`);
    } else {
      console.log(`✗ Final result not found on Spotify, returning anyway`);
    }

    return { songTitle: output!.songTitle, spotifyUrl: spotifyResult?.spotifyUrl || 'https://open.spotify.com' };
  }
);
