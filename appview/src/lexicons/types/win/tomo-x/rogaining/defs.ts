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
  teamCount?: number
  checkpointCount?: number
  participantCount?: number
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
  team: TeamView
  /** Sum of approved checkpoint points and the team's finish-time bonus. */
  totalPoints: number
  /** Number of distinct non-goal checkpoints with an approved submission. */
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
  /** URL of the checkpoint image. */
  imageUrl?: string
  /** URLs of the internal images. Only returned to the event's author. */
  internalImageUrls?: string[]
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
  /** The team the author belongs to in this event. */
  team: string
  /** The win.tomo-x.rogaining.submit record. */
  record: { [_ in string]: unknown }
  /** Decided by one valid approve or reject record for the submission's current cid, made by the event's author or approver. The author's records take precedence over the approver's; among one account's records, the one with the newest createdAt wins. approved or rejected by that record, otherwise pending. Only approved submissions count for the ranking. */
  status: 'pending' | 'approved' | 'rejected' | (string & {})
  photoUrl?: string
  indexedAt: string
  /** AT-URI of the approve record, if approved. */
  approvalUri?: string
  /** AT-URI of the reject record, if rejected. */
  rejectionUri?: string
  /** The reason of the approve or reject record that decided the status. */
  reason?: string
  /** Distance between the submitted location and the checkpoint, for the approver's review. */
  distanceMeters?: number
  /** Whether the submission's createdAt is between the event's startsAt and endsAt, for the approver's review. */
  withinEventPeriod?: boolean
}

const hashSubmissionView = 'submissionView'

export function isSubmissionView<V>(v: V) {
  return is$typed(v, id, hashSubmissionView)
}

export function validateSubmissionView<V>(v: V) {
  return validate<SubmissionView & V>(v, id, hashSubmissionView)
}
