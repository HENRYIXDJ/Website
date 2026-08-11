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
      name: 'obsStreamKey',
      title: 'OBS Ingest Stream Key',
      type: 'string',
      description: 'Secret RTMP key configured in OBS Studio',
    }),
    defineField({
      name: 'status',
      title: 'Stream Status',
      type: 'string',
      options: {
        list: [
          { title: 'Upcoming Show Scheduled', value: 'upcoming' },
          { title: 'Live Broadcast Active', value: 'live' },
          { title: 'Concluded Grace Period', value: 'ended' },
          { title: 'Archived VOD Broadcast', value: 'archived' }
        ]
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'countdownMinutes',
      title: 'Countdown Offset (Minutes)',
      type: 'number',
      description: '0 = Go Live Immediately; 5, 10, 15, 30, 60 = Countdown Timer before broadcast',
      initialValue: 5,
    }),
    defineField({
      name: 'scheduledTime',
      title: 'Scheduled Time',
      type: 'datetime',
      description: 'The date and time when the upcoming stream is scheduled to start.',
    }),
    defineField({
      name: 'endedAt',
      title: 'Ended At Time',
      type: 'datetime',
      description: 'Timestamp when the active broadcast concluded.',
    }),
    defineField({
      name: 'multiPlatformTargets',
      title: 'Multi-Platform Restream Destinations',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'platform', title: 'Platform', type: 'string' }),
            defineField({ name: 'enabled', title: 'Enabled', type: 'boolean' }),
            defineField({ name: 'streamKey', title: 'Stream Key', type: 'string' }),
            defineField({ name: 'targetUrl', title: 'Target RTMP URL', type: 'string' }),
          ],
        },
      ],
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
