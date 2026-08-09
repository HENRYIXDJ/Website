import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schema } from '@/sanity/schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Henry IX Website',

  projectId: 'r6mln4n3',
  dataset: 'production',
  basePath: '/studio', // Prefix route for embedded NextStudio

  plugins: [structureTool()],

  schema: schema,
})
