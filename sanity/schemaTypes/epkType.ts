import { defineField, defineType } from 'sanity'

export const epkType = defineType({
  name: 'epk',
  title: 'EPK & Press Kit',
  type: 'document',
  fields: [
    defineField({
      name: 'artistName',
      title: 'Artist Name',
      type: 'string',
      initialValue: 'HENRY IX',
    }),
    defineField({
      name: 'shortBio',
      title: 'Short Bio (1 Paragraph)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'fullBio',
      title: 'Full Biography',
      type: 'text',
      rows: 8,
    }),
    defineField({
      name: 'techRiderPdf',
      title: 'Technical Rider PDF',
      type: 'file',
      description: 'Upload DJ Technical Rider PDF for festival stage managers',
    }),
    defineField({
      name: 'pressPhotosZip',
      title: 'Hi-Res Press Kit Photos (ZIP / Link)',
      type: 'url',
      description: 'Link to Dropbox/Google Drive or zip file containing hi-res 300DPI press photos',
    }),
    defineField({
      name: 'managementEmail',
      title: 'Booking & Management Email',
      type: 'string',
      placeholder: 'booking@henryix.com',
    }),
  ],
})
