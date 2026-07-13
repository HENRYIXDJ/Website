import { defineField, defineType } from 'sanity'

export const mixGroupType = defineType({
  name: 'mixGroup',
  title: 'Mix Group (e.g. Knight Club)',
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
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'mixes',
      title: 'Mixes in this Group',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'mix' } }],
    }),
  ],
})
