import { defineField, defineType } from 'sanity'

export const subscriberType = defineType({
  name: 'subscriber',
  title: 'Mailing List Subscribers',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subscribedAt',
      title: 'Subscription Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'source',
      title: 'Signup Location',
      type: 'string',
      initialValue: 'Website Newsletter',
    }),
  ],
  preview: {
    select: {
      title: 'email',
      subtitle: 'subscribedAt',
    },
  },
})
