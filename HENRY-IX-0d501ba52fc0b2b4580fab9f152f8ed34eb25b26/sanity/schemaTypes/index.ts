import { mixType } from './mixType'
import { mixGroupType } from './mixGroupType'
import { liveStreamType } from './liveStreamType'
import { galleryImageType } from './galleryImageType'
import { eventType } from './eventType'
import { epkType } from './epkType'
import { subscriberType } from './subscriberType'

export const schema = {
  types: [
    mixType, 
    mixGroupType, 
    liveStreamType, 
    galleryImageType,
    eventType,
    epkType,
    subscriberType
  ],
}
