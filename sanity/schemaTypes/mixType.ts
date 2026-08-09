import { defineField, defineType } from 'sanity'

export const mixType = defineType({
  name: 'mix',
  title: 'Mix / Track',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'bpm',
      title: 'BPM',
      type: 'number',
    }),
    defineField({
      name: 'soundcloudLink',
      title: 'SoundCloud Link',
      type: 'url',
    }),
    defineField({
      name: 'audioFile',
      title: 'Audio File path (R2 relative)',
      type: 'string',
      description: 'The path to the audio file in your Cloudflare R2 bucket (e.g. /Mixes/Knight Club/KC Music/Session 1.mp3)',
    }),

    defineField({
      name: 'artworkFile',
      title: 'Artwork File path (R2 relative)',
      type: 'string',
      description: 'The path to the artwork file in your Cloudflare R2 bucket',
    }),
    defineField({
      name: 'tracklist',
      title: 'Tracklist',
      type: 'text',
      description: 'The tracklist of songs in this mix (one per line)',
    }),
    defineField({
      name: 'cuePoints',
      title: 'Cue Points (ms)',
      type: 'array',
      of: [{ type: 'number' }],
    }),
  ],
})
