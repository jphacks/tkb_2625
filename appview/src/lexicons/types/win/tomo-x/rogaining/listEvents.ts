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
const id = 'win.tomo-x.rogaining.listEvents'

export type QueryParams = {
  /** Filter by event period relative to now. */
  status?: 'upcoming' | 'ongoing' | 'ended' | (string & {})
  /** Only events approved by this DID. */
  approver?: string
}
export type InputSchema = undefined

export interface OutputSchema {
  events: WinTomoXRogainingDefs.EventView[]
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
