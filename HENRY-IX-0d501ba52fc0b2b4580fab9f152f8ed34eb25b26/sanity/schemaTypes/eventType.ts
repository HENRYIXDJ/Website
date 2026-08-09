import { defineField, defineType } from 'sanity'

export const eventType = defineType({
  name: 'event',
  title: 'Events & Tickets',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Event Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Event Date & Time',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'venue',
      title: 'Venue Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'city',
      title: 'City & Country',
      type: 'string',
      placeholder: 'London, UK',
    }),
    defineField({
      name: 'ticketUrl',
      title: 'Ticket Link or Stripe Checkout URL',
      type: 'url',
      description: 'Paste direct ticket purchase link or Stripe Payment Link (buy.stripe.com/...)',
    }),
    defineField({
      name: 'ticketPrice',
      title: 'Ticket Price (e.g. £15 / Free)',
      type: 'string',
    }),
    defineField({
      name: 'status',
      title: 'Ticket Status',
      type: 'string',
      options: {
        list: [
          { title: 'On Sale', value: 'on_sale' },
          { title: 'Sold Out', value: 'sold_out' },
          { title: 'Secret Set / RSVP', value: 'rsvp' },
          { title: 'Cancelled', value: 'cancelled' },
        ],
      },
      initialValue: 'on_sale',
    }),
    defineField({
      name: 'poster',
      title: 'Event Flyer / Poster Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'description',
      title: 'Event Details / Lineup',
      type: 'text',
      rows: 4,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'venue',
      media: 'poster',
    },
  },
})
