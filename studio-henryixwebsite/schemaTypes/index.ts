import { type SchemaTypeDefinition } from 'sanity'
import { mixType } from './mixType'
import { mixGroupType } from './mixGroupType'
import { galleryImageType } from './galleryImageType'
import { liveStreamType } from './liveStreamType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [mixGroupType, mixType, galleryImageType, liveStreamType],
}
