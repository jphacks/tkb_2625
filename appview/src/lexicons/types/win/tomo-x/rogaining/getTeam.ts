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
const id = 'win.tomo-x.rogaining.getTeam'

export type QueryParams = {
  team: string
}
export type InputSchema = undefined

export interface OutputSchema {
  team: WinTomoXRogainingDefs.TeamView
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
  error?: 'TeamNotFound'
}

export type HandlerOutput = HandlerError | HandlerSuccess
