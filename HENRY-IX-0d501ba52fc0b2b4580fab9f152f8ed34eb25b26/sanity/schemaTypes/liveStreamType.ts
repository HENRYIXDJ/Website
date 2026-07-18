import { defineField, defineType } from 'sanity'

export const liveStreamType = defineType({
  name: 'liveStream',
  title: 'Live Stream Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Stream/VOD Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'playbackId',
      title: 'Stream Playback URL / ID',
      type: 'string',
      description: 'Enter direct HLS stream URL (.m3u8), YouTube video/live link, Twitch channel link, or Mux playback ID.',
    }),
    defineField({
      name: 'viewerUserId',
      title: 'Mux Viewer User ID (Metadata)',
      type: 'string',
    }),
    defineField({
      name: 'status',
      title: 'Stream Status',
      type: 'string',
      options: {
        list: [
          { title: 'Upcoming Show Scheduled', value: 'upcoming' },
          { title: 'Live Broadcast Active', value: 'live' },
          { title: 'Archived VOD Broadcast', value: 'archived' }
        ]
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'scheduledTime',
      title: 'Scheduled Time',
      type: 'datetime',
      description: 'The date and time when the upcoming stream is scheduled to start.',
    }),
    defineField({
      name: 'diagnosticsResolution',
      title: 'Diagnostics Resolution',
      type: 'string',
      options: {
        list: [
          { title: '1080P60 HD', value: '1080P60 HD' },
          { title: '720P60 HD', value: '720P60 HD' },
          { title: '480P30 SD', value: '480P30 SD' }
        ]
      }
    }),
    defineField({
      name: 'diagnosticsLatency',
      title: 'Diagnostics Latency Mode',
      type: 'string',
      options: {
        list: [
          { title: 'Low Latency', value: 'Low Latency' },
          { title: 'Standard Latency', value: 'Standard Latency' }
        ]
      }
    })
  ],
})
