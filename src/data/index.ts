import type { PackId, TopicPack } from './types'
import { environmentPack } from './packs/environment'
import { jobPack } from './packs/job'
import { travelPack } from './packs/travel'

export const PACKS: Record<PackId, TopicPack> = {
  environment: environmentPack,
  job: jobPack,
  travel: travelPack,
}

export const PACK_ORDER: PackId[] = ['environment', 'job', 'travel']

export function getPack(id: PackId): TopicPack {
  return PACKS[id]
}
