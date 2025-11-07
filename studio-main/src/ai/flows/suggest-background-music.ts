'use server';

/**
 * @fileOverview AI flow for suggesting background music for uploaded images.
 *
 * - suggestBackgroundMusic - A function that suggests background music for an image.
 * - SuggestBackgroundMusicInput - The input type for the suggestBackgroundMusic function.
 * - SuggestBackgroundMusicOutput - The return type for the suggestBackgroundMusic function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import SpotifyWebApi from 'spotify-web-api-node';

const SuggestBackgroundMusicInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().optional().describe('Optional description of the image.'),
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
  input: {schema: SuggestBackgroundMusicInputSchema},
  output: {schema: PromptOutputSchema},
  prompt: `You are an AI assistant that suggests trending songs for images based on current online trends.

  Based on the image (and the optional description), suggest ONE suitable trending song that fits the mood or theme of the image. Consider popular songs from various genres that are currently trending online, such as hits from music charts, viral tracks, or popular songs across different cultures and languages. Ensure the song is likely available on major platforms like Spotify. Provide only the song title.

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
    for (let i = 0; i < 3; i++) {
      const {output} = await prompt(input);
      if (output) {
        const spotifyResult = await searchSpotifyTrack(output.songTitle);
        if (spotifyResult) {
          return { songTitle: spotifyResult.songTitle, spotifyUrl: spotifyResult.spotifyUrl };
        }
      }
    }
    // If all attempts fail, return the last suggestion
    const {output} = await prompt(input);
    const spotifyResult = await searchSpotifyTrack(output!.songTitle);
    return { songTitle: output!.songTitle, spotifyUrl: spotifyResult?.spotifyUrl || 'https://open.spotify.com' };
  }
);
