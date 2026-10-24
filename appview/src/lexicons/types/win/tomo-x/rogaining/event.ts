/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from "@atproto/lexicon";
import { CID } from "multiformats/cid";
import { validate as _validate } from "../../../../lexicons.js";
import { type $Typed, is$typed as _is$typed, type OmitKey } from "../../../../util.js";

const is$typed = _is$typed,
  validate = _validate;
const id = "win.tomo-x.rogaining.event";

export interface Record {
  $type: "win.tomo-x.rogaining.event";
  name: string;
  image?: BlobRef;
  /** When the event ends. */
  endsAt: string;
  /** The DID of the user who can approve submissions for this event. */
  approver: string;
  /** When the event starts. */
  startsAt: string;
  createdAt: string;
  description?: string;
  [k: string]: unknown;
}

const hashRecord = "main";

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord);
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true);
}
