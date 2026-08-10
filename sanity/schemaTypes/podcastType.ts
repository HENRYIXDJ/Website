import { defineField, defineType } from 'sanity'

export const podcastType = defineType({
  name: 'podcastEpisode',
  title: 'Podcast Episode',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Episode Title',
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
      name: 'seasonNumber',
      title: 'Season Number',
      type: 'number',
      initialValue: 1,
    }),
    defineField({
      name: 'episodeNumber',
      title: 'Episode Number',
      type: 'number',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Episode Summary / Show Notes',
      type: 'text',
      description: 'Detailed description of the episode, guests, topics discussed, and links.',
    }),
    defineField({
      name: 'guests',
      title: 'Featured Guests',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'audioUrl',
      title: 'Audio File URL / R2 Relative Path',
      type: 'string',
      description: 'Path or direct URL to the podcast episode audio file (MP3/M4A)',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'artworkUrl',
      title: 'Episode Cover Artwork URL / R2 Path',
      type: 'string',
      description: '1:1 ratio square artwork image for podcast directories',
    }),
    defineField({
      name: 'duration',
      title: 'Duration (e.g. 00:45:30)',
      type: 'string',
    }),
    defineField({
      name: 'explicit',
      title: 'Explicit Content Flag',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'publishedAt',
      title: 'Publish Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
})
