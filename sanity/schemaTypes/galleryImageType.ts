import { defineField, defineType } from 'sanity'

export const galleryImageType = defineType({
  name: 'galleryImage',
  title: 'Gallery Image',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'album',
      title: 'Album Name / CCTV Cam Channel',
      type: 'string',
      description: 'e.g. Knight Club Sessions, Royal Court Residency, Me, Artwork, Live Gigs 2026',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Me', value: 'me' },
          { title: 'Artwork', value: 'artwork' },
          { title: 'Gig Performance', value: 'gigs' },
          { title: 'Studio Gear', value: 'studio' },
          { title: 'Custom Album', value: 'custom' },
        ],
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'imageFile',
      title: 'Image File path (R2 relative)',
      type: 'string',
      description: 'The path to the image file in your R2 bucket.',
    }),
    defineField({
      name: 'imageUrl',
      title: 'Direct Image URL',
      type: 'string',
    }),
    defineField({
      name: 'gridClass',
      title: 'Grid CSS Class',
      type: 'string',
      description: 'Tailwind CSS classes for gallery layout (e.g., col-span-1 md:col-span-2 aspect-[2/1])',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'caption',
      title: 'Caption / Description',
      type: 'text',
    }),
  ],
})
