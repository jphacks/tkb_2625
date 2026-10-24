/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from "@atproto/lexicon";
import { CID } from "multiformats/cid";
import { validate as _validate } from "../../../../lexicons.js";
import { type $Typed, is$typed as _is$typed, type OmitKey } from "../../../../util.js";
import type * as ComAtprotoRepoStrongRef from "../../../com/atproto/repo/strongRef.js";
import type * as WinTomoXRogainingDefs from "./defs.js";

const is$typed = _is$typed,
  validate = _validate;
const id = "win.tomo-x.rogaining.submit";

export interface Record {
  $type: "win.tomo-x.rogaining.submit";
  event: ComAtprotoRepoStrongRef.Main;
  /** Photo as proof of arrival. */
  photo: BlobRef;
  location: WinTomoXRogainingDefs.Location;
  /** When the checkpoint was reached. */
  createdAt: string;
  checkpoint: ComAtprotoRepoStrongRef.Main;
  [k: string]: unknown;
}

const hashRecord = "main";

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord);
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true);
}
