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
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Me', value: 'me' },
          { title: 'Artwork', value: 'artwork' },
        ],
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'imageFile',
      title: 'Image File path (R2 relative)',
      type: 'string',
      description: 'The path to the image file in your R2 bucket. For pictures of yourself, upload them to the "gallery/Me/" folder and set this path (e.g., "/gallery/Me/your-photo.jpg").',
    }),
    defineField({
      name: 'gridClass',
      title: 'Grid CSS Class',
      type: 'string',
      description: 'Tailwind CSS classes for gallery layout (e.g., col-span-1 md:col-span-2 aspect-[2/1])',
    }),
  ],
})
