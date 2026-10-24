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
import type * as ComAtprotoRepoStrongRef from '../../../com/atproto/repo/strongRef.js'
import type * as ComAtprotoLabelDefs from '../../../com/atproto/label/defs.js'
import type * as AppBskyActorDefs from '../actor/defs.js'
import type * as AppBskyEmbedDefs from './defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.bsky.embed.external'

/** A representation of some externally linked content (eg, a URL and 'card'), embedded in a Bluesky record (eg, a post). */
export interface Main {
  $type?: 'app.bsky.embed.external'
  external: External
}

const hashMain = 'main'

export function isMain<V>(v: V) {
  return is$typed(v, id, hashMain)
}

export function validateMain<V>(v: V) {
  return validate<Main & V>(v, id, hashMain)
}

export interface View {
  $type?: 'app.bsky.embed.external#view'
  external: ViewExternal
}

const hashView = 'view'

export function isView<V>(v: V) {
  return is$typed(v, id, hashView)
}

export function validateView<V>(v: V) {
  return validate<View & V>(v, id, hashView)
}

/** RGB color definition, inspired by site.standard.theme.color#rgb */
export interface ColorRGB {
  $type?: 'app.bsky.embed.external#colorRGB'
  b: number
  g: number
  r: number
}

const hashColorRGB = 'colorRGB'

export function isColorRGB<V>(v: V) {
  return is$typed(v, id, hashColorRGB)
}

export function validateColorRGB<V>(v: V) {
  return validate<ColorRGB & V>(v, id, hashColorRGB)
}

export interface External {
  $type?: 'app.bsky.embed.external#external'
  uri: string
  thumb?: BlobRef
  title: string
  description: string
  /** StrongRefs (uri+cid) of the Atmosphere records that backed this view. */
  associatedRefs?: ComAtprotoRepoStrongRef.Main[]
}

const hashExternal = 'external'

export function isExternal<V>(v: V) {
  return is$typed(v, id, hashExternal)
}

export function validateExternal<V>(v: V) {
  return validate<External & V>(v, id, hashExternal)
}

export interface ViewArticle {
  $type?: 'app.bsky.embed.external#viewArticle'
  uri: string
  image?: string
  title: string
  labels?: ComAtprotoLabelDefs.Label[]
  /** Available profile previews. Selected deterministically by DID; not a ranking. */
  likers?: AppBskyActorDefs.ProfileViewBasic[]
  createdAt?: string
  likeCount?: number
  publisher?: ViewArticlePublication
  updatedAt?: string
  description: string
  readingTime?: number
  associatedRefs?: ComAtprotoRepoStrongRef.Main[]
  associatedProfiles?: AppBskyActorDefs.ProfileViewBasic[]
}

const hashViewArticle = 'viewArticle'

export function isViewArticle<V>(v: V) {
  return is$typed(v, id, hashViewArticle)
}

export function validateViewArticle<V>(v: V) {
  return validate<ViewArticle & V>(v, id, hashViewArticle)
}

export interface ViewGallery {
  $type?: 'app.bsky.embed.external#viewGallery'
  uri: string
  /** The media items in the gallery. Each item may be of a different type, but all types must be supported by the client. */
  items: ($Typed<ViewGalleryImage> | { $type: string })[]
  title: string
  labels?: ComAtprotoLabelDefs.Label[]
  /** Available profile previews. Selected deterministically by DID; not a ranking. */
  likers?: AppBskyActorDefs.ProfileViewBasic[]
  createdAt?: string
  likeCount?: number
  updatedAt?: string
  description: string
  associatedRefs?: ComAtprotoRepoStrongRef.Main[]
  associatedProfiles?: AppBskyActorDefs.ProfileViewBasic[]
}

const hashViewGallery = 'viewGallery'

export function isViewGallery<V>(v: V) {
  return is$typed(v, id, hashViewGallery)
}

export function validateViewGallery<V>(v: V) {
  return validate<ViewGallery & V>(v, id, hashViewGallery)
}

export interface ViewExternal {
  $type?: 'app.bsky.embed.external#viewExternal'
  uri: string
  thumb?: string
  title: string
  labels?: ComAtprotoLabelDefs.Label[]
  source?: ViewExternalSource
  /** When the external content was created, if available. Example: a publication date, for an article. */
  createdAt?: string
  /** When the external content was updated, if available. */
  updatedAt?: string
  description: string
  /** Estimated reading time in minutes, if applicable and available. */
  readingTime?: number
  /** StrongRefs (uri+cid) of the Atmosphere records that backed this view. */
  associatedRefs?: ComAtprotoRepoStrongRef.Main[]
  /** Profiles of the owners of the Atmosphere records that backed this view. */
  associatedProfiles?: AppBskyActorDefs.ProfileViewBasic[]
}

const hashViewExternal = 'viewExternal'

export function isViewExternal<V>(v: V) {
  return is$typed(v, id, hashViewExternal)
}

export function validateViewExternal<V>(v: V) {
  return validate<ViewExternal & V>(v, id, hashViewExternal)
}

export interface ViewLivestream {
  $type?: 'app.bsky.embed.external#viewLivestream'
  uri: string
  image?: string
  title: string
  /** True if the livestream is currently active at the time this view is served, false if it has ended. */
  active: boolean
  labels?: ComAtprotoLabelDefs.Label[]
  endedAt?: string
  createdAt?: string
  startedAt?: string
  updatedAt?: string
  description: string
  associatedRefs?: ComAtprotoRepoStrongRef.Main[]
  associatedProfiles?: AppBskyActorDefs.ProfileViewBasic[]
}

const hashViewLivestream = 'viewLivestream'

export function isViewLivestream<V>(v: V) {
  return is$typed(v, id, hashViewLivestream)
}

export function validateViewLivestream<V>(v: V) {
  return validate<ViewLivestream & V>(v, id, hashViewLivestream)
}

export interface ViewGalleryImage {
  $type?: 'app.bsky.embed.external#viewGalleryImage'
  /** Alt text description of the image, for accessibility. */
  alt?: string
  /** Fully-qualified URL where a large version of the image can be fetched. May or may not be the exact original blob. For example, CDN location provided by the App View. */
  fullsize: string
  /** Fully-qualified URL where a thumbnail of the image can be fetched. For example, CDN location provided by the App View. */
  thumbnail: string
  aspectRatio?: AppBskyEmbedDefs.AspectRatio
}

const hashViewGalleryImage = 'viewGalleryImage'

export function isViewGalleryImage<V>(v: V) {
  return is$typed(v, id, hashViewGalleryImage)
}

export function validateViewGalleryImage<V>(v: V) {
  return validate<ViewGalleryImage & V>(v, id, hashViewGalleryImage)
}

/** The source of an external embed, such as a standard.site publication. */
export interface ViewExternalSource {
  $type?: 'app.bsky.embed.external#viewExternalSource'
  /** URI of the source, if available. Example: the https:// URL of a site.standard.publication record. */
  uri: string
  /** Fully-qualified URL where an icon representing the source can be fetched. For example, CDN location provided by the App View. */
  icon?: string
  theme?: ViewExternalSourceTheme
  title: string
  description?: string
}

const hashViewExternalSource = 'viewExternalSource'

export function isViewExternalSource<V>(v: V) {
  return is$typed(v, id, hashViewExternalSource)
}

export function validateViewExternalSource<V>(v: V) {
  return validate<ViewExternalSource & V>(v, id, hashViewExternalSource)
}

export interface ViewArticlePublication {
  $type?: 'app.bsky.embed.external#viewArticlePublication'
  uri: string
  logo?: string
  image?: string
  theme?: ViewArticlePublicationTheme
  title: string
  labels?: ComAtprotoLabelDefs.Label[]
  createdAt?: string
  updatedAt?: string
  description: string
  /** Available profile previews. Selected deterministically by DID; not a ranking. */
  subscribers?: AppBskyActorDefs.ProfileViewBasic[]
  associatedRefs?: ComAtprotoRepoStrongRef.Main[]
  subscriptionCount?: number
  associatedProfiles?: AppBskyActorDefs.ProfileViewBasic[]
}

const hashViewArticlePublication = 'viewArticlePublication'

export function isViewArticlePublication<V>(v: V) {
  return is$typed(v, id, hashViewArticlePublication)
}

export function validateViewArticlePublication<V>(v: V) {
  return validate<ViewArticlePublication & V>(v, id, hashViewArticlePublication)
}

/** The theme colors of an external source, such as a site.standard.publication. These colors may be used when rendering an embed from that source. */
export interface ViewExternalSourceTheme {
  $type?: 'app.bsky.embed.external#viewExternalSourceTheme'
  accentRGB?: ColorRGB
  backgroundRGB?: ColorRGB
  foregroundRGB?: ColorRGB
  accentForegroundRGB?: ColorRGB
}

const hashViewExternalSourceTheme = 'viewExternalSourceTheme'

export function isViewExternalSourceTheme<V>(v: V) {
  return is$typed(v, id, hashViewExternalSourceTheme)
}

export function validateViewExternalSourceTheme<V>(v: V) {
  return validate<ViewExternalSourceTheme & V>(
    v,
    id,
    hashViewExternalSourceTheme,
  )
}

export interface ViewArticlePublicationTheme {
  $type?: 'app.bsky.embed.external#viewArticlePublicationTheme'
  /** Hex color string, if available. Example: '#ffffff'. */
  accent?: string
  /** Hex color string, if available. Example: '#ffffff'. */
  background?: string
  /** Hex color string, if available. Example: '#ffffff'. */
  foreground?: string
  /** Hex color string, if available. Example: '#ffffff'. */
  accentForeground?: string
}

const hashViewArticlePublicationTheme = 'viewArticlePublicationTheme'

export function isViewArticlePublicationTheme<V>(v: V) {
  return is$typed(v, id, hashViewArticlePublicationTheme)
}

export function validateViewArticlePublicationTheme<V>(v: V) {
  return validate<ViewArticlePublicationTheme & V>(
    v,
    id,
    hashViewArticlePublicationTheme,
  )
}
