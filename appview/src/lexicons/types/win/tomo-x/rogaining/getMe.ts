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
import type * as WinTomoXRogainingDefs from './defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'win.tomo-x.rogaining.getMe'

export type QueryParams = {}
export type InputSchema = undefined

export interface OutputSchema {
  /** Events the requester participates in as a team member, with their team. */
  participating: Participation[]
  /** Events authored by the requester. */
  organizing: WinTomoXRogainingDefs.EventView[]
}

export type HandlerInput = undefined

export interface HandlerSuccess {
  encoding: 'application/json'
  body: OutputSchema
  headers?: { [key: string]: string }
}

export interface HandlerError {
  status: number
  message?: string
}

export type HandlerOutput = HandlerError | HandlerSuccess

export interface Participation {
  $type?: 'win.tomo-x.rogaining.getMe#participation'
  event: WinTomoXRogainingDefs.EventView
  team: WinTomoXRogainingDefs.TeamView
}

const hashParticipation = 'participation'

export function isParticipation<V>(v: V) {
  return is$typed(v, id, hashParticipation)
}

export function validateParticipation<V>(v: V) {
  return validate<Participation & V>(v, id, hashParticipation)
}
