import { defineField, defineType } from 'sanity'

export const socialConnectionType = defineType({
  name: 'socialConnection',
  title: 'Social Media & Integration Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'platform',
      title: 'Platform Name',
      type: 'string',
      options: {
        list: [
          { title: 'YouTube Live', value: 'youtube' },
          { title: 'Twitch', value: 'twitch' },
          { title: 'Kick', value: 'kick' },
          { title: 'TikTok Live', value: 'tiktok' },
          { title: 'Instagram', value: 'instagram' },
          { title: 'X (Twitter)', value: 'x' },
          { title: 'SoundCloud', value: 'soundcloud' },
          { title: 'Spotify', value: 'spotify' },
          { title: 'Discord Webhook', value: 'discord' },
          { title: 'Resend Email Hub (@henryix.com)', value: 'resend' },
        ],
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'enabled',
      title: 'Enable Multi-Stream / Cross-Post',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'streamKeyOrToken',
      title: 'Stream Key / Webhook URL / Access Token',
      type: 'string',
      description: 'Secret stream key or webhook destination for broadcast sync',
    }),
    defineField({
      name: 'accountHandle',
      title: 'Account Handle / Channel URL',
      type: 'string',
    }),
    defineField({
      name: 'lastSyncTime',
      title: 'Last Sync Timestamp',
      type: 'datetime',
    }),
  ],
})
