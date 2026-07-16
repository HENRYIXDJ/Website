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
      title: 'Mux Playback ID',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'viewerUserId',
      title: 'Mux Viewer User ID (Metadata)',
      type: 'string',
    }),
    defineField({
      name: 'streamStatus',
      title: 'Stream Status',
      type: 'string',
      options: {
        list: [
          { title: 'Live Broadcast Active', value: 'active' },
          { title: 'Offline / Last Broadcast Archive', value: 'offline' }
        ]
      },
      validation: Rule => Rule.required(),
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
