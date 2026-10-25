/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  type Auth,
  type ErrorResult,
  type HonoXRPCOptions as XrpcOptions,
  type XRPCHono as XrpcServer,
  type HonoConfigOrHandler,
  type HonoStreamConfigOrHandler,
  createXRPCHono as createXrpcServer,
} from '@evex-dev/xrpc-hono'
import { type Env } from 'hono'
import { schemas } from './lexicons.js'
import * as WinTomoXRogainingGetCheckpoints from './types/win/tomo-x/rogaining/getCheckpoints.js'
import * as WinTomoXRogainingGetEvent from './types/win/tomo-x/rogaining/getEvent.js'
import * as WinTomoXRogainingGetMe from './types/win/tomo-x/rogaining/getMe.js'
import * as WinTomoXRogainingGetRanking from './types/win/tomo-x/rogaining/getRanking.js'
import * as WinTomoXRogainingGetTeam from './types/win/tomo-x/rogaining/getTeam.js'
import * as WinTomoXRogainingListEvents from './types/win/tomo-x/rogaining/listEvents.js'
import * as WinTomoXRogainingListSubmissions from './types/win/tomo-x/rogaining/listSubmissions.js'

export const APP_BSKY_FEED = {
  DefsRequestLess: 'app.bsky.feed.defs#requestLess',
  DefsRequestMore: 'app.bsky.feed.defs#requestMore',
  DefsInteractionLike: 'app.bsky.feed.defs#interactionLike',
  DefsInteractionSeen: 'app.bsky.feed.defs#interactionSeen',
  DefsClickthroughItem: 'app.bsky.feed.defs#clickthroughItem',
  DefsContentModeVideo: 'app.bsky.feed.defs#contentModeVideo',
  DefsInteractionQuote: 'app.bsky.feed.defs#interactionQuote',
  DefsInteractionReply: 'app.bsky.feed.defs#interactionReply',
  DefsInteractionShare: 'app.bsky.feed.defs#interactionShare',
  DefsClickthroughEmbed: 'app.bsky.feed.defs#clickthroughEmbed',
  DefsInteractionRepost: 'app.bsky.feed.defs#interactionRepost',
  DefsClickthroughAuthor: 'app.bsky.feed.defs#clickthroughAuthor',
  DefsClickthroughReposter: 'app.bsky.feed.defs#clickthroughReposter',
  DefsContentModeUnspecified: 'app.bsky.feed.defs#contentModeUnspecified',
}
export const APP_BSKY_GRAPH = {
  DefsModlist: 'app.bsky.graph.defs#modlist',
  DefsCuratelist: 'app.bsky.graph.defs#curatelist',
  DefsReferencelist: 'app.bsky.graph.defs#referencelist',
}
export const COM_ATPROTO_MODERATION = {
  DefsReasonRude: 'com.atproto.moderation.defs#reasonRude',
  DefsReasonSpam: 'com.atproto.moderation.defs#reasonSpam',
  DefsReasonOther: 'com.atproto.moderation.defs#reasonOther',
  DefsReasonAppeal: 'com.atproto.moderation.defs#reasonAppeal',
  DefsReasonSexual: 'com.atproto.moderation.defs#reasonSexual',
  DefsReasonViolation: 'com.atproto.moderation.defs#reasonViolation',
  DefsReasonMisleading: 'com.atproto.moderation.defs#reasonMisleading',
}

export function createServer<E extends Env = Env>(
  options?: XrpcOptions<E>,
): Server<E> {
  return new Server<E>(options)
}

export class Server<E extends Env> {
  xrpc: XrpcServer<E>
  app: AppNS<E>
  com: ComNS<E>
  win: WinNS<E>

  constructor(options?: XrpcOptions<E>) {
    this.xrpc = createXrpcServer<E>(schemas, options)
    this.app = new AppNS<E>(this)
    this.com = new ComNS<E>(this)
    this.win = new WinNS<E>(this)
  }
}

export class AppNS<E extends Env> {
  _server: Server<E>
  bsky: AppBskyNS<E>

  constructor(server: Server<E>) {
    this._server = server
    this.bsky = new AppBskyNS<E>(server)
  }
}

export class AppBskyNS<E extends Env> {
  _server: Server<E>
  embed: AppBskyEmbedNS<E>
  feed: AppBskyFeedNS<E>
  richtext: AppBskyRichtextNS<E>

  constructor(server: Server<E>) {
    this._server = server
    this.embed = new AppBskyEmbedNS<E>(server)
    this.feed = new AppBskyFeedNS<E>(server)
    this.richtext = new AppBskyRichtextNS<E>(server)
  }
}

export class AppBskyEmbedNS<E extends Env> {
  _server: Server<E>

  constructor(server: Server<E>) {
    this._server = server
  }
}

export class AppBskyFeedNS<E extends Env> {
  _server: Server<E>

  constructor(server: Server<E>) {
    this._server = server
  }
}

export class AppBskyRichtextNS<E extends Env> {
  _server: Server<E>

  constructor(server: Server<E>) {
    this._server = server
  }
}

export class ComNS<E extends Env> {
  _server: Server<E>
  atproto: ComAtprotoNS<E>

  constructor(server: Server<E>) {
    this._server = server
    this.atproto = new ComAtprotoNS<E>(server)
  }
}

export class ComAtprotoNS<E extends Env> {
  _server: Server<E>
  repo: ComAtprotoRepoNS<E>

  constructor(server: Server<E>) {
    this._server = server
    this.repo = new ComAtprotoRepoNS<E>(server)
  }
}

export class ComAtprotoRepoNS<E extends Env> {
  _server: Server<E>

  constructor(server: Server<E>) {
    this._server = server
  }
}

export class WinNS<E extends Env> {
  _server: Server<E>
  tomoX: WinTomoXNS<E>

  constructor(server: Server<E>) {
    this._server = server
    this.tomoX = new WinTomoXNS<E>(server)
  }
}

export class WinTomoXNS<E extends Env> {
  _server: Server<E>
  rogaining: WinTomoXRogainingNS<E>

  constructor(server: Server<E>) {
    this._server = server
    this.rogaining = new WinTomoXRogainingNS<E>(server)
  }
}

export class WinTomoXRogainingNS<E extends Env> {
  _server: Server<E>

  constructor(server: Server<E>) {
    this._server = server
  }

  getCheckpoints<A extends Auth | ErrorResult = undefined>(
    cfg: HonoConfigOrHandler<
      E,
      A,
      WinTomoXRogainingGetCheckpoints.QueryParams,
      WinTomoXRogainingGetCheckpoints.HandlerInput,
      WinTomoXRogainingGetCheckpoints.HandlerOutput
    >,
  ) {
    const nsid = 'win.tomo-x.rogaining.getCheckpoints'
    return this._server.xrpc.addMethod(nsid, cfg)
  }

  getEvent<A extends Auth | ErrorResult = undefined>(
    cfg: HonoConfigOrHandler<
      E,
      A,
      WinTomoXRogainingGetEvent.QueryParams,
      WinTomoXRogainingGetEvent.HandlerInput,
      WinTomoXRogainingGetEvent.HandlerOutput
    >,
  ) {
    const nsid = 'win.tomo-x.rogaining.getEvent'
    return this._server.xrpc.addMethod(nsid, cfg)
  }

  getMe<A extends Auth | ErrorResult = undefined>(
    cfg: HonoConfigOrHandler<
      E,
      A,
      WinTomoXRogainingGetMe.QueryParams,
      WinTomoXRogainingGetMe.HandlerInput,
      WinTomoXRogainingGetMe.HandlerOutput
    >,
  ) {
    const nsid = 'win.tomo-x.rogaining.getMe'
    return this._server.xrpc.addMethod(nsid, cfg)
  }

  getRanking<A extends Auth | ErrorResult = undefined>(
    cfg: HonoConfigOrHandler<
      E,
      A,
      WinTomoXRogainingGetRanking.QueryParams,
      WinTomoXRogainingGetRanking.HandlerInput,
      WinTomoXRogainingGetRanking.HandlerOutput
    >,
  ) {
    const nsid = 'win.tomo-x.rogaining.getRanking'
    return this._server.xrpc.addMethod(nsid, cfg)
  }

  getTeam<A extends Auth | ErrorResult = undefined>(
    cfg: HonoConfigOrHandler<
      E,
      A,
      WinTomoXRogainingGetTeam.QueryParams,
      WinTomoXRogainingGetTeam.HandlerInput,
      WinTomoXRogainingGetTeam.HandlerOutput
    >,
  ) {
    const nsid = 'win.tomo-x.rogaining.getTeam'
    return this._server.xrpc.addMethod(nsid, cfg)
  }

  listEvents<A extends Auth | ErrorResult = undefined>(
    cfg: HonoConfigOrHandler<
      E,
      A,
      WinTomoXRogainingListEvents.QueryParams,
      WinTomoXRogainingListEvents.HandlerInput,
      WinTomoXRogainingListEvents.HandlerOutput
    >,
  ) {
    const nsid = 'win.tomo-x.rogaining.listEvents'
    return this._server.xrpc.addMethod(nsid, cfg)
  }

  listSubmissions<A extends Auth | ErrorResult = undefined>(
    cfg: HonoConfigOrHandler<
      E,
      A,
      WinTomoXRogainingListSubmissions.QueryParams,
      WinTomoXRogainingListSubmissions.HandlerInput,
      WinTomoXRogainingListSubmissions.HandlerOutput
    >,
  ) {
    const nsid = 'win.tomo-x.rogaining.listSubmissions'
    return this._server.xrpc.addMethod(nsid, cfg)
  }
}
