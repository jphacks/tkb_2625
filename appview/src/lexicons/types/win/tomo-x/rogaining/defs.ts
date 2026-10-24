/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons.js'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util.js'
import type * as AppBskyActorDefs from '../../../app/bsky/actor/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'win.tomo-x.rogaining.defs'

/** Coordinates as decimal degrees encoded as strings (lexicon has no float type), e.g. "35.681236". */
export interface Location {
  $type?: 'win.tomo-x.rogaining.defs#location'
  latitude: string
  longitude: string
}

const hashLocation = 'location'

export function isLocation<V>(v: V) {
  return is$typed(v, id, hashLocation)
}

export function validateLocation<V>(v: V) {
  return validate<Location & V>(v, id, hashLocation)
}

export interface EventView {
  $type?: 'win.tomo-x.rogaining.defs#eventView'
  cid: string
  uri: string
  author: AppBskyActorDefs.ProfileViewBasic
  /** The win.tomo-x.rogaining.event record. */
  record: { [_ in string]: unknown }
  approver?: AppBskyActorDefs.ProfileViewBasic
  imageUrl?: string
  indexedAt: string
  checkpointCount?: number
  participantCount?: number
  teamCount?: number
}

const hashEventView = 'eventView'

export function isEventView<V>(v: V) {
  return is$typed(v, id, hashEventView)
}

export function validateEventView<V>(v: V) {
  return validate<EventView & V>(v, id, hashEventView)
}

export interface RankingEntry {
  $type?: 'win.tomo-x.rogaining.defs#rankingEntry'
  rank: number
  participant: AppBskyActorDefs.ProfileViewBasic
  totalPoints: number
  approvedCount: number
}

const hashRankingEntry = 'rankingEntry'

export function isRankingEntry<V>(v: V) {
  return is$typed(v, id, hashRankingEntry)
}

export function validateRankingEntry<V>(v: V) {
  return validate<RankingEntry & V>(v, id, hashRankingEntry)
}

export interface CheckpointView {
  $type?: 'win.tomo-x.rogaining.defs#checkpointView'
  cid: string
  uri: string
  /** The win.tomo-x.rogaining.checkpoint record. */
  record: { [_ in string]: unknown }
  indexedAt: string
}

const hashCheckpointView = 'checkpointView'

export function isCheckpointView<V>(v: V) {
  return is$typed(v, id, hashCheckpointView)
}

export function validateCheckpointView<V>(v: V) {
  return validate<CheckpointView & V>(v, id, hashCheckpointView)
}

export interface SubmissionView {
  $type?: 'win.tomo-x.rogaining.defs#submissionView'
  cid: string
  uri: string
  author: AppBskyActorDefs.ProfileViewBasic
  /** The win.tomo-x.rogaining.submit record. */
  record: { [_ in string]: unknown }
  /** approved when a valid approve record by the event's approver exists. */
  status: 'pending' | 'approved' | (string & {})
  photoUrl?: string
  indexedAt: string
  /** AT-URI of the approve record, if approved. */
  approvalUri?: string
}

const hashSubmissionView = 'submissionView'

export function isSubmissionView<V>(v: V) {
  return is$typed(v, id, hashSubmissionView)
}

export function validateSubmissionView<V>(v: V) {
  return validate<SubmissionView & V>(v, id, hashSubmissionView)
}

export interface TeamView {
  $type?: 'win.tomo-x.rogaining.defs#teamView'
  cid: string
  uri: string
  /** The win.tomo-x.rogaining.team record. */
  record: { [_ in string]: unknown }
  /** Profiles of the team members. */
  members: AppBskyActorDefs.ProfileViewBasic[]
  indexedAt: string
}

const hashTeamView = 'teamView'

export function isTeamView<V>(v: V) {
  return is$typed(v, id, hashTeamView)
}

export function validateTeamView<V>(v: V) {
  return validate<TeamView & V>(v, id, hashTeamView)
}
