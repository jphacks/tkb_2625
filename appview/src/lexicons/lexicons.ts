/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  type LexiconDoc,
  Lexicons,
  ValidationError,
  type ValidationResult,
} from '@atproto/lexicon'
import { type $Typed, is$typed, maybe$typed } from './util.js'

export const schemaDict = {
  AppBskyActorDefs: {
    id: 'app.bsky.actor.defs',
    defs: {
      nux: {
        type: 'object',
        required: ['id', 'completed'],
        properties: {
          id: {
            type: 'string',
            maxLength: 100,
          },
          data: {
            type: 'string',
            maxLength: 3000,
            description:
              'Arbitrary data for the NUX. The structure is defined by the NUX itself. Limited to 300 characters.',
            maxGraphemes: 300,
          },
          completed: {
            type: 'boolean',
            default: false,
          },
          expiresAt: {
            type: 'string',
            format: 'datetime',
            description:
              'The date and time at which the NUX will expire and should be considered completed.',
          },
        },
        description: 'A new user experiences (NUX) storage object',
      },
      mutedWord: {
        type: 'object',
        required: ['value', 'targets'],
        properties: {
          id: {
            type: 'string',
          },
          value: {
            type: 'string',
            maxLength: 10000,
            description: 'The muted word itself.',
            maxGraphemes: 1000,
          },
          targets: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#mutedWordTarget',
              type: 'ref',
            },
            description: 'The intended targets of the muted word.',
          },
          expiresAt: {
            type: 'string',
            format: 'datetime',
            description:
              'The date and time at which the muted word will expire and no longer be applied.',
          },
          actorTarget: {
            type: 'string',
            default: 'all',
            description:
              'Groups of users to apply the muted word to. If undefined, applies to all users.',
            knownValues: ['all', 'exclude-following'],
          },
        },
        description: 'A word that the account owner has muted.',
      },
      savedFeed: {
        type: 'object',
        required: ['id', 'type', 'value', 'pinned'],
        properties: {
          id: {
            type: 'string',
          },
          type: {
            type: 'string',
            knownValues: ['feed', 'list', 'timeline'],
          },
          value: {
            type: 'string',
          },
          pinned: {
            type: 'boolean',
          },
        },
      },
      statusView: {
        type: 'object',
        required: ['status', 'record'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          embed: {
            refs: ['lex:app.bsky.embed.external#view'],
            type: 'union',
            description: 'An optional embed associated with the status.',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          record: {
            type: 'unknown',
          },
          status: {
            type: 'string',
            description: 'The status for the account.',
            knownValues: ['app.bsky.actor.status#live'],
          },
          isActive: {
            type: 'boolean',
            description:
              'True if the status is not expired, false if it is expired. Only present if expiration was set.',
          },
          expiresAt: {
            type: 'string',
            format: 'datetime',
            description:
              'The date when this status will expire. The application might choose to no longer return the status after expiration.',
          },
          isDisabled: {
            type: 'boolean',
            description:
              "True if the user's go-live access has been disabled by a moderator, false otherwise.",
          },
        },
      },
      preferences: {
        type: 'array',
        items: {
          refs: [
            'lex:app.bsky.actor.defs#adultContentPref',
            'lex:app.bsky.actor.defs#contentLabelPref',
            'lex:app.bsky.actor.defs#savedFeedsPref',
            'lex:app.bsky.actor.defs#savedFeedsPrefV2',
            'lex:app.bsky.actor.defs#personalDetailsPref',
            'lex:app.bsky.actor.defs#declaredAgePref',
            'lex:app.bsky.actor.defs#feedViewPref',
            'lex:app.bsky.actor.defs#threadViewPref',
            'lex:app.bsky.actor.defs#interestsPref',
            'lex:app.bsky.actor.defs#mutedWordsPref',
            'lex:app.bsky.actor.defs#hiddenPostsPref',
            'lex:app.bsky.actor.defs#bskyAppStatePref',
            'lex:app.bsky.actor.defs#labelersPref',
            'lex:app.bsky.actor.defs#postInteractionSettingsPref',
            'lex:app.bsky.actor.defs#verificationPrefs',
            'lex:app.bsky.actor.defs#liveEventPreferences',
          ],
          type: 'union',
        },
      },
      profileView: {
        type: 'object',
        required: ['did', 'handle'],
        properties: {
          did: {
            type: 'string',
            format: 'did',
          },
          debug: {
            type: 'unknown',
            description: 'Debug information for internal development',
          },
          avatar: {
            type: 'string',
            format: 'uri',
          },
          handle: {
            type: 'string',
            format: 'handle',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          status: {
            ref: 'lex:app.bsky.actor.defs#statusView',
            type: 'ref',
          },
          viewer: {
            ref: 'lex:app.bsky.actor.defs#viewerState',
            type: 'ref',
          },
          pronouns: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          associated: {
            ref: 'lex:app.bsky.actor.defs#profileAssociated',
            type: 'ref',
          },
          description: {
            type: 'string',
            maxLength: 2560,
            maxGraphemes: 256,
          },
          displayName: {
            type: 'string',
            maxLength: 640,
            maxGraphemes: 64,
          },
          verification: {
            ref: 'lex:app.bsky.actor.defs#verificationState',
            type: 'ref',
          },
        },
      },
      viewerState: {
        type: 'object',
        properties: {
          muted: {
            type: 'boolean',
            description:
              'Whether the account is fully muted, directly or via a mutelist. False when the mute is scoped to specific kinds; see mutedOnlyReposts and mutedOnlyQuoteposts.',
          },
          blocking: {
            type: 'string',
            format: 'at-uri',
          },
          blockedBy: {
            type: 'boolean',
          },
          following: {
            type: 'string',
            format: 'at-uri',
          },
          followedBy: {
            type: 'string',
            format: 'at-uri',
          },
          mutedByList: {
            ref: 'lex:app.bsky.graph.defs#listViewBasic',
            type: 'ref',
          },
          blockingByList: {
            ref: 'lex:app.bsky.graph.defs#listViewBasic',
            type: 'ref',
          },
          knownFollowers: {
            ref: 'lex:app.bsky.actor.defs#knownFollowers',
            type: 'ref',
            description:
              'This property is present only in selected cases, as an optimization.',
          },
          mutedOnlyReposts: {
            type: 'boolean',
            description:
              "Whether the account's reposts are muted. Scoped mutes are exclusive with muted: this can be true while muted is false. If muted is true, this will be false.",
          },
          mutedOnlyQuoteposts: {
            type: 'boolean',
            description:
              "Whether the account's quote posts are muted. Scoped mutes are exclusive with muted: this can be true while muted is false. If muted is true, this will be false.",
          },
          activitySubscription: {
            ref: 'lex:app.bsky.notification.defs#activitySubscription',
            type: 'ref',
            description:
              'This property is present only in selected cases, as an optimization.',
          },
        },
        description:
          "Metadata about the requesting account's relationship with the subject account. Only has meaningful content for authed requests.",
      },
      feedViewPref: {
        type: 'object',
        required: ['feed'],
        properties: {
          feed: {
            type: 'string',
            description:
              'The URI of the feed, or an identifier which describes the feed.',
          },
          hideReplies: {
            type: 'boolean',
            description: 'Hide replies in the feed.',
          },
          hideReposts: {
            type: 'boolean',
            description: 'Hide reposts in the feed.',
          },
          hideQuotePosts: {
            type: 'boolean',
            description: 'Hide quote posts in the feed.',
          },
          hideRepliesByLikeCount: {
            type: 'integer',
            description:
              'Hide replies in the feed if they do not have this number of likes.',
          },
          hideRepliesByUnfollowed: {
            type: 'boolean',
            default: true,
            description:
              'Hide replies in the feed if they are not by followed users.',
          },
        },
      },
      labelersPref: {
        type: 'object',
        required: ['labelers'],
        properties: {
          labelers: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#labelerPrefItem',
              type: 'ref',
            },
          },
        },
      },
      interestsPref: {
        type: 'object',
        required: ['tags'],
        properties: {
          tags: {
            type: 'array',
            items: {
              type: 'string',
              maxLength: 640,
              maxGraphemes: 64,
            },
            maxLength: 100,
            description:
              "A list of tags which describe the account owner's interests gathered during onboarding.",
          },
          updatedAt: {
            type: 'string',
            format: 'datetime',
            description:
              'The timestamp when the account owner last updated their interests.',
          },
        },
      },
      knownFollowers: {
        type: 'object',
        required: ['count', 'followers'],
        properties: {
          count: {
            type: 'integer',
          },
          followers: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#profileViewBasic',
              type: 'ref',
            },
            maxLength: 5,
            minLength: 0,
          },
        },
        description: "The subject's followers whom you also follow",
      },
      mutedWordsPref: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#mutedWord',
              type: 'ref',
            },
            description: 'A list of words the account owner has muted.',
          },
        },
      },
      savedFeedsPref: {
        type: 'object',
        required: ['pinned', 'saved'],
        properties: {
          saved: {
            type: 'array',
            items: {
              type: 'string',
              format: 'at-uri',
            },
          },
          pinned: {
            type: 'array',
            items: {
              type: 'string',
              format: 'at-uri',
            },
          },
          timelineIndex: {
            type: 'integer',
          },
        },
      },
      threadViewPref: {
        type: 'object',
        properties: {
          sort: {
            type: 'string',
            description: 'Sorting mode for threads.',
            knownValues: [
              'oldest',
              'newest',
              'most-likes',
              'random',
              'hotness',
            ],
          },
        },
      },
      declaredAgePref: {
        type: 'object',
        properties: {
          isOverAge13: {
            type: 'boolean',
            description:
              'Indicates if the user has declared that they are over 13 years of age.',
          },
          isOverAge16: {
            type: 'boolean',
            description:
              'Indicates if the user has declared that they are over 16 years of age.',
          },
          isOverAge18: {
            type: 'boolean',
            description:
              'Indicates if the user has declared that they are over 18 years of age.',
          },
        },
        description:
          "Read-only preference containing value(s) inferred from the user's declared birthdate. Absence of this preference object in the response indicates that the user has not made a declaration.",
      },
      hiddenPostsPref: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'string',
              format: 'at-uri',
            },
            description:
              'A list of URIs of posts the account owner has hidden.',
          },
        },
      },
      labelerPrefItem: {
        type: 'object',
        required: ['did'],
        properties: {
          did: {
            type: 'string',
            format: 'did',
          },
        },
      },
      mutedWordTarget: {
        type: 'string',
        maxLength: 640,
        knownValues: ['content', 'tag'],
        maxGraphemes: 64,
      },
      profileLinkView: {
        type: 'object',
        required: ['uri', 'cid', 'url'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
            description:
              'The app.bsky.actor.link record, e.g. for reporting the link.',
          },
          url: {
            type: 'string',
            format: 'uri',
            description: 'The link destination.',
          },
          icon: {
            type: 'string',
            format: 'uri',
            description: "Image URL for the destination site's icon.",
          },
          title: {
            type: 'string',
            maxLength: 320,
            maxGraphemes: 40,
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
        },
      },
      adultContentPref: {
        type: 'object',
        required: ['enabled'],
        properties: {
          enabled: {
            type: 'boolean',
            default: false,
          },
        },
      },
      bskyAppStatePref: {
        type: 'object',
        properties: {
          nuxs: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#nux',
              type: 'ref',
            },
            maxLength: 100,
            description: 'Storage for NUXs the user has encountered.',
          },
          isBetaUser: {
            type: 'boolean',
            description:
              'Indicates if the user is participating in the beta features program.',
          },
          queuedNudges: {
            type: 'array',
            items: {
              type: 'string',
              maxLength: 100,
            },
            maxLength: 1000,
            description:
              'An array of tokens which identify nudges (modals, popups, tours, highlight dots) that should be shown to the user.',
          },
          activeProgressGuide: {
            ref: 'lex:app.bsky.actor.defs#bskyAppProgressGuide',
            type: 'ref',
          },
        },
        description:
          "A grab bag of state that's specific to the bsky.app program. Third-party apps shouldn't use this.",
      },
      contentLabelPref: {
        type: 'object',
        required: ['label', 'visibility'],
        properties: {
          label: {
            type: 'string',
          },
          labelerDid: {
            type: 'string',
            format: 'did',
            description:
              'Which labeler does this preference apply to? If undefined, applies globally.',
          },
          visibility: {
            type: 'string',
            knownValues: ['ignore', 'show', 'warn', 'hide'],
          },
        },
      },
      profileViewBasic: {
        type: 'object',
        required: ['did', 'handle'],
        properties: {
          did: {
            type: 'string',
            format: 'did',
          },
          debug: {
            type: 'unknown',
            description: 'Debug information for internal development',
          },
          avatar: {
            type: 'string',
            format: 'uri',
          },
          handle: {
            type: 'string',
            format: 'handle',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          status: {
            ref: 'lex:app.bsky.actor.defs#statusView',
            type: 'ref',
          },
          viewer: {
            ref: 'lex:app.bsky.actor.defs#viewerState',
            type: 'ref',
          },
          pronouns: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
          },
          associated: {
            ref: 'lex:app.bsky.actor.defs#profileAssociated',
            type: 'ref',
          },
          displayName: {
            type: 'string',
            maxLength: 640,
            maxGraphemes: 64,
          },
          verification: {
            ref: 'lex:app.bsky.actor.defs#verificationState',
            type: 'ref',
          },
        },
      },
      savedFeedsPrefV2: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#savedFeed',
              type: 'ref',
            },
          },
        },
      },
      verificationView: {
        type: 'object',
        required: ['issuer', 'uri', 'isValid', 'createdAt'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
            description: 'The AT-URI of the verification record.',
          },
          issuer: {
            type: 'string',
            format: 'did',
            description: 'The user who issued this verification.',
          },
          isValid: {
            type: 'boolean',
            description:
              'True if the verification passes validation, otherwise false.',
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
            description: 'Timestamp when the verification was created.',
          },
          issuerHandle: {
            type: 'string',
            format: 'handle',
            description: 'The handle of the issuer.',
          },
          issuerDisplayName: {
            type: 'string',
            description: 'The display name of the issuer.',
          },
        },
        description: 'An individual verification for an associated subject.',
      },
      profileAssociated: {
        type: 'object',
        properties: {
          chat: {
            ref: 'lex:app.bsky.actor.defs#profileAssociatedChat',
            type: 'ref',
          },
          germ: {
            ref: 'lex:app.bsky.actor.defs#profileAssociatedGerm',
            type: 'ref',
          },
          lists: {
            type: 'integer',
          },
          labeler: {
            type: 'boolean',
          },
          feedgens: {
            type: 'integer',
          },
          starterPacks: {
            type: 'integer',
          },
          activitySubscription: {
            ref: 'lex:app.bsky.actor.defs#profileAssociatedActivitySubscription',
            type: 'ref',
          },
        },
      },
      verificationPrefs: {
        type: 'object',
        required: [],
        properties: {
          hideBadges: {
            type: 'boolean',
            default: false,
            description:
              'Hide the blue check badges for verified accounts and trusted verifiers.',
          },
        },
        description: 'Preferences for how verified accounts appear in the app.',
      },
      verificationState: {
        type: 'object',
        required: ['verifications', 'verifiedStatus', 'trustedVerifierStatus'],
        properties: {
          verifications: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#verificationView',
              type: 'ref',
            },
            description:
              'All verifications issued by trusted verifiers on behalf of this user. Verifications by untrusted verifiers are not included.',
          },
          verifiedStatus: {
            type: 'string',
            description: "The user's status as a verified account.",
            knownValues: ['valid', 'invalid', 'none'],
          },
          trustedVerifierStatus: {
            type: 'string',
            description: "The user's status as a trusted verifier.",
            knownValues: ['valid', 'invalid', 'none'],
          },
        },
        description:
          'Represents the verification information about the user this object is attached to.',
      },
      personalDetailsPref: {
        type: 'object',
        properties: {
          birthDate: {
            type: 'string',
            format: 'datetime',
            description: 'The birth date of account owner.',
          },
        },
      },
      profileViewDetailed: {
        type: 'object',
        required: ['did', 'handle'],
        properties: {
          did: {
            type: 'string',
            format: 'did',
          },
          debug: {
            type: 'unknown',
            description: 'Debug information for internal development',
          },
          links: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#profileLinkView',
              type: 'ref',
            },
            description:
              "The profile's links, in display order. Links that were taken down or don't resolve are left out.",
          },
          avatar: {
            type: 'string',
            format: 'uri',
          },
          banner: {
            type: 'string',
            format: 'uri',
          },
          handle: {
            type: 'string',
            format: 'handle',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          status: {
            ref: 'lex:app.bsky.actor.defs#statusView',
            type: 'ref',
          },
          viewer: {
            ref: 'lex:app.bsky.actor.defs#viewerState',
            type: 'ref',
          },
          website: {
            type: 'string',
            format: 'uri',
            description: 'Deprecated: use links instead.',
          },
          pronouns: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          associated: {
            ref: 'lex:app.bsky.actor.defs#profileAssociated',
            type: 'ref',
          },
          pinnedPost: {
            ref: 'lex:com.atproto.repo.strongRef',
            type: 'ref',
          },
          postsCount: {
            type: 'integer',
          },
          description: {
            type: 'string',
            maxLength: 2560,
            maxGraphemes: 256,
          },
          displayName: {
            type: 'string',
            maxLength: 640,
            maxGraphemes: 64,
          },
          followsCount: {
            type: 'integer',
          },
          verification: {
            ref: 'lex:app.bsky.actor.defs#verificationState',
            type: 'ref',
          },
          followersCount: {
            type: 'integer',
          },
          joinedViaStarterPack: {
            ref: 'lex:app.bsky.graph.defs#starterPackViewBasic',
            type: 'ref',
          },
        },
      },
      bskyAppProgressGuide: {
        type: 'object',
        required: ['guide'],
        properties: {
          guide: {
            type: 'string',
            maxLength: 100,
          },
        },
        description:
          'If set, an active progress guide. Once completed, can be set to undefined. Should have unspecced fields tracking progress.',
      },
      liveEventPreferences: {
        type: 'object',
        properties: {
          hideAllFeeds: {
            type: 'boolean',
            default: false,
            description: 'Whether to hide all feeds from live events.',
          },
          hiddenFeedIds: {
            type: 'array',
            items: {
              type: 'string',
            },
            description:
              'A list of feed IDs that the user has hidden from live events.',
          },
        },
        description: 'Preferences for live events.',
      },
      profileAssociatedChat: {
        type: 'object',
        required: ['allowIncoming'],
        properties: {
          allowIncoming: {
            type: 'string',
            knownValues: ['all', 'none', 'following'],
          },
          allowGroupInvites: {
            type: 'string',
            knownValues: ['all', 'none', 'following'],
          },
        },
      },
      profileAssociatedGerm: {
        type: 'object',
        required: ['showButtonTo', 'messageMeUrl'],
        properties: {
          messageMeUrl: {
            type: 'string',
            format: 'uri',
          },
          showButtonTo: {
            type: 'string',
            knownValues: ['usersIFollow', 'everyone'],
          },
        },
      },
      postInteractionSettingsPref: {
        type: 'object',
        required: [],
        properties: {
          threadgateAllowRules: {
            type: 'array',
            items: {
              refs: [
                'lex:app.bsky.feed.threadgate#mentionRule',
                'lex:app.bsky.feed.threadgate#followerRule',
                'lex:app.bsky.feed.threadgate#followingRule',
                'lex:app.bsky.feed.threadgate#listRule',
              ],
              type: 'union',
            },
            maxLength: 5,
            description:
              'Matches threadgate record. List of rules defining who can reply to this users posts. If value is an empty array, no one can reply. If value is undefined, anyone can reply.',
          },
          postgateEmbeddingRules: {
            type: 'array',
            items: {
              refs: ['lex:app.bsky.feed.postgate#disableRule'],
              type: 'union',
            },
            maxLength: 5,
            description:
              'Matches postgate record. List of rules defining who can embed this users posts. If value is an empty array or is undefined, no particular rules apply and anyone can embed.',
          },
        },
        description:
          'Default post interaction settings for the account. These values should be applied as default values when creating new posts. These refs should mirror the threadgate and postgate records exactly.',
      },
      profileAssociatedActivitySubscription: {
        type: 'object',
        required: ['allowSubscriptions'],
        properties: {
          allowSubscriptions: {
            type: 'string',
            knownValues: ['followers', 'mutuals', 'none'],
          },
        },
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  AppBskyEmbedDefs: {
    id: 'app.bsky.embed.defs',
    defs: {
      aspectRatio: {
        type: 'object',
        required: ['width', 'height'],
        properties: {
          width: {
            type: 'integer',
            minimum: 1,
          },
          height: {
            type: 'integer',
            minimum: 1,
          },
        },
        description:
          'width:height represents an aspect ratio. It may be approximate, and may not correspond to absolute dimensions in any given unit.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  AppBskyEmbedExternal: {
    id: 'app.bsky.embed.external',
    defs: {
      main: {
        type: 'object',
        required: ['external'],
        properties: {
          external: {
            ref: 'lex:app.bsky.embed.external#external',
            type: 'ref',
          },
        },
        description:
          "A representation of some externally linked content (eg, a URL and 'card'), embedded in a Bluesky record (eg, a post).",
      },
      view: {
        type: 'object',
        required: ['external'],
        properties: {
          external: {
            ref: 'lex:app.bsky.embed.external#viewExternal',
            type: 'ref',
          },
        },
      },
      colorRGB: {
        type: 'object',
        required: ['r', 'g', 'b'],
        properties: {
          b: {
            type: 'integer',
            maximum: 255,
            minimum: 0,
          },
          g: {
            type: 'integer',
            maximum: 255,
            minimum: 0,
          },
          r: {
            type: 'integer',
            maximum: 255,
            minimum: 0,
          },
        },
        description:
          'RGB color definition, inspired by site.standard.theme.color#rgb',
      },
      external: {
        type: 'object',
        required: ['uri', 'title', 'description'],
        properties: {
          uri: {
            type: 'string',
            format: 'uri',
          },
          thumb: {
            type: 'blob',
            accept: ['image/*'],
            maxSize: 1000000,
          },
          title: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          associatedRefs: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.repo.strongRef',
              type: 'ref',
            },
            description:
              'StrongRefs (uri+cid) of the Atmosphere records that backed this view.',
          },
        },
      },
      viewArticle: {
        type: 'object',
        required: ['uri', 'title', 'description'],
        properties: {
          uri: {
            type: 'string',
            format: 'uri',
          },
          image: {
            type: 'string',
            format: 'uri',
          },
          title: {
            type: 'string',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          likers: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#profileViewBasic',
              type: 'ref',
            },
            maxLength: 3,
            description:
              'Available profile previews. Selected deterministically by DID; not a ranking.',
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
          },
          likeCount: {
            type: 'integer',
            minimum: 0,
          },
          publisher: {
            ref: 'lex:app.bsky.embed.external#viewArticlePublication',
            type: 'ref',
          },
          updatedAt: {
            type: 'string',
            format: 'datetime',
          },
          description: {
            type: 'string',
          },
          readingTime: {
            type: 'integer',
            minimum: 1,
          },
          associatedRefs: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.repo.strongRef',
              type: 'ref',
            },
          },
          associatedProfiles: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#profileViewBasic',
              type: 'ref',
            },
          },
        },
      },
      viewGallery: {
        type: 'object',
        required: ['uri', 'title', 'description', 'items'],
        properties: {
          uri: {
            type: 'string',
            format: 'uri',
          },
          items: {
            type: 'array',
            items: {
              refs: ['lex:app.bsky.embed.external#viewGalleryImage'],
              type: 'union',
            },
            description:
              'The media items in the gallery. Each item may be of a different type, but all types must be supported by the client.',
          },
          title: {
            type: 'string',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          likers: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#profileViewBasic',
              type: 'ref',
            },
            maxLength: 3,
            description:
              'Available profile previews. Selected deterministically by DID; not a ranking.',
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
          },
          likeCount: {
            type: 'integer',
            minimum: 0,
          },
          updatedAt: {
            type: 'string',
            format: 'datetime',
          },
          description: {
            type: 'string',
          },
          associatedRefs: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.repo.strongRef',
              type: 'ref',
            },
          },
          associatedProfiles: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#profileViewBasic',
              type: 'ref',
            },
          },
        },
      },
      viewExternal: {
        type: 'object',
        required: ['uri', 'title', 'description'],
        properties: {
          uri: {
            type: 'string',
            format: 'uri',
          },
          thumb: {
            type: 'string',
            format: 'uri',
          },
          title: {
            type: 'string',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          source: {
            ref: 'lex:app.bsky.embed.external#viewExternalSource',
            type: 'ref',
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
            description:
              'When the external content was created, if available. Example: a publication date, for an article.',
          },
          updatedAt: {
            type: 'string',
            format: 'datetime',
            description: 'When the external content was updated, if available.',
          },
          description: {
            type: 'string',
          },
          readingTime: {
            type: 'integer',
            description:
              'Estimated reading time in minutes, if applicable and available.',
          },
          associatedRefs: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.repo.strongRef',
              type: 'ref',
            },
            description:
              'StrongRefs (uri+cid) of the Atmosphere records that backed this view.',
          },
          associatedProfiles: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#profileViewBasic',
              type: 'ref',
            },
            description:
              'Profiles of the owners of the Atmosphere records that backed this view.',
          },
        },
      },
      viewLivestream: {
        type: 'object',
        required: ['uri', 'title', 'description', 'active'],
        properties: {
          uri: {
            type: 'string',
            format: 'uri',
          },
          image: {
            type: 'string',
            format: 'uri',
          },
          title: {
            type: 'string',
          },
          active: {
            type: 'boolean',
            description:
              'True if the livestream is currently active at the time this view is served, false if it has ended.',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          endedAt: {
            type: 'string',
            format: 'datetime',
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
          },
          startedAt: {
            type: 'string',
            format: 'datetime',
          },
          updatedAt: {
            type: 'string',
            format: 'datetime',
          },
          description: {
            type: 'string',
          },
          associatedRefs: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.repo.strongRef',
              type: 'ref',
            },
          },
          associatedProfiles: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#profileViewBasic',
              type: 'ref',
            },
          },
        },
      },
      viewGalleryImage: {
        type: 'object',
        required: ['thumbnail', 'fullsize'],
        properties: {
          alt: {
            type: 'string',
            description:
              'Alt text description of the image, for accessibility.',
          },
          fullsize: {
            type: 'string',
            format: 'uri',
            description:
              'Fully-qualified URL where a large version of the image can be fetched. May or may not be the exact original blob. For example, CDN location provided by the App View.',
          },
          thumbnail: {
            type: 'string',
            format: 'uri',
            description:
              'Fully-qualified URL where a thumbnail of the image can be fetched. For example, CDN location provided by the App View.',
          },
          aspectRatio: {
            ref: 'lex:app.bsky.embed.defs#aspectRatio',
            type: 'ref',
          },
        },
      },
      viewExternalSource: {
        type: 'object',
        required: ['uri', 'title'],
        properties: {
          uri: {
            type: 'string',
            format: 'uri',
            description:
              'URI of the source, if available. Example: the https:// URL of a site.standard.publication record.',
          },
          icon: {
            type: 'string',
            format: 'uri',
            description:
              'Fully-qualified URL where an icon representing the source can be fetched. For example, CDN location provided by the App View.',
          },
          theme: {
            ref: 'lex:app.bsky.embed.external#viewExternalSourceTheme',
            type: 'ref',
          },
          title: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
        },
        description:
          'The source of an external embed, such as a standard.site publication.',
      },
      viewArticlePublication: {
        type: 'object',
        required: ['uri', 'title', 'description'],
        properties: {
          uri: {
            type: 'string',
            format: 'uri',
          },
          logo: {
            type: 'string',
            format: 'uri',
          },
          image: {
            type: 'string',
            format: 'uri',
          },
          theme: {
            ref: 'lex:app.bsky.embed.external#viewArticlePublicationTheme',
            type: 'ref',
          },
          title: {
            type: 'string',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
          },
          updatedAt: {
            type: 'string',
            format: 'datetime',
          },
          description: {
            type: 'string',
          },
          subscribers: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#profileViewBasic',
              type: 'ref',
            },
            maxLength: 3,
            description:
              'Available profile previews. Selected deterministically by DID; not a ranking.',
          },
          associatedRefs: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.repo.strongRef',
              type: 'ref',
            },
          },
          subscriptionCount: {
            type: 'integer',
            minimum: 0,
          },
          associatedProfiles: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#profileViewBasic',
              type: 'ref',
            },
          },
        },
      },
      viewExternalSourceTheme: {
        type: 'object',
        properties: {
          accentRGB: {
            ref: 'lex:app.bsky.embed.external#colorRGB',
            type: 'ref',
          },
          backgroundRGB: {
            ref: 'lex:app.bsky.embed.external#colorRGB',
            type: 'ref',
          },
          foregroundRGB: {
            ref: 'lex:app.bsky.embed.external#colorRGB',
            type: 'ref',
          },
          accentForegroundRGB: {
            ref: 'lex:app.bsky.embed.external#colorRGB',
            type: 'ref',
          },
        },
        description:
          'The theme colors of an external source, such as a site.standard.publication. These colors may be used when rendering an embed from that source.',
      },
      viewArticlePublicationTheme: {
        type: 'object',
        properties: {
          accent: {
            type: 'string',
            description: "Hex color string, if available. Example: '#ffffff'.",
          },
          background: {
            type: 'string',
            description: "Hex color string, if available. Example: '#ffffff'.",
          },
          foreground: {
            type: 'string',
            description: "Hex color string, if available. Example: '#ffffff'.",
          },
          accentForeground: {
            type: 'string',
            description: "Hex color string, if available. Example: '#ffffff'.",
          },
        },
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  AppBskyEmbedGallery: {
    id: 'app.bsky.embed.gallery',
    defs: {
      main: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: {
              refs: ['lex:app.bsky.embed.gallery#image'],
              type: 'union',
              description:
                'The media items in the gallery. Each item may be of a different type, but all types must be supported by the client.',
            },
            maxLength: 20,
            description:
              'The schema-level maxLength of 20 is a future-proof ceiling. Clients should currently enforce a soft limit of 10 items in authoring UIs.',
          },
        },
      },
      view: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: {
              refs: ['lex:app.bsky.embed.gallery#viewImage'],
              type: 'union',
            },
          },
        },
      },
      image: {
        type: 'object',
        required: ['image', 'alt', 'aspectRatio'],
        properties: {
          alt: {
            type: 'string',
            description:
              'Alt text description of the image, for accessibility.',
          },
          image: {
            type: 'blob',
            accept: ['image/*'],
            maxSize: 2000000,
          },
          aspectRatio: {
            ref: 'lex:app.bsky.embed.defs#aspectRatio',
            type: 'ref',
          },
        },
      },
      viewImage: {
        type: 'object',
        required: ['thumbnail', 'fullsize', 'alt', 'aspectRatio'],
        properties: {
          alt: {
            type: 'string',
            description:
              'Alt text description of the image, for accessibility.',
          },
          fullsize: {
            type: 'string',
            format: 'uri',
            description:
              'Fully-qualified URL where a large version of the image can be fetched. May or may not be the exact original blob. For example, CDN location provided by the App View.',
          },
          thumbnail: {
            type: 'string',
            format: 'uri',
            description:
              'Fully-qualified URL where a thumbnail of the image can be fetched. For example, CDN location provided by the App View.',
          },
          aspectRatio: {
            ref: 'lex:app.bsky.embed.defs#aspectRatio',
            type: 'ref',
          },
        },
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
    description:
      'An assortment of media embedded in a Bluesky record (eg, a post).',
  },
  AppBskyEmbedImages: {
    id: 'app.bsky.embed.images',
    defs: {
      main: {
        type: 'object',
        required: ['images'],
        properties: {
          images: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.embed.images#image',
              type: 'ref',
            },
            maxLength: 4,
          },
        },
      },
      view: {
        type: 'object',
        required: ['images'],
        properties: {
          images: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.embed.images#viewImage',
              type: 'ref',
            },
            maxLength: 4,
          },
        },
      },
      image: {
        type: 'object',
        required: ['image', 'alt'],
        properties: {
          alt: {
            type: 'string',
            description:
              'Alt text description of the image, for accessibility.',
          },
          image: {
            type: 'blob',
            accept: ['image/*'],
            maxSize: 2000000,
            description:
              'The raw image file. May be up to 2 MB, formerly limited to 1 MB.',
          },
          aspectRatio: {
            ref: 'lex:app.bsky.embed.defs#aspectRatio',
            type: 'ref',
          },
        },
      },
      viewImage: {
        type: 'object',
        required: ['thumb', 'fullsize', 'alt'],
        properties: {
          alt: {
            type: 'string',
            description:
              'Alt text description of the image, for accessibility.',
          },
          thumb: {
            type: 'string',
            format: 'uri',
            description:
              'Fully-qualified URL where a thumbnail of the image can be fetched. For example, CDN location provided by the App View.',
          },
          fullsize: {
            type: 'string',
            format: 'uri',
            description:
              'Fully-qualified URL where a large version of the image can be fetched. May or may not be the exact original blob. For example, CDN location provided by the App View.',
          },
          aspectRatio: {
            ref: 'lex:app.bsky.embed.defs#aspectRatio',
            type: 'ref',
          },
        },
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
    description: 'A set of images embedded in a Bluesky record (eg, a post).',
  },
  AppBskyEmbedRecord: {
    id: 'app.bsky.embed.record',
    defs: {
      main: {
        type: 'object',
        required: ['record'],
        properties: {
          record: {
            ref: 'lex:com.atproto.repo.strongRef',
            type: 'ref',
          },
        },
      },
      view: {
        type: 'object',
        required: ['record'],
        properties: {
          record: {
            refs: [
              'lex:app.bsky.embed.record#viewRecord',
              'lex:app.bsky.embed.record#viewNotFound',
              'lex:app.bsky.embed.record#viewBlocked',
              'lex:app.bsky.embed.record#viewDetached',
              'lex:app.bsky.feed.defs#generatorView',
              'lex:app.bsky.graph.defs#listView',
              'lex:app.bsky.labeler.defs#labelerView',
              'lex:app.bsky.graph.defs#starterPackViewBasic',
            ],
            type: 'union',
          },
        },
      },
      viewRecord: {
        type: 'object',
        required: ['uri', 'cid', 'author', 'value', 'indexedAt'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          value: {
            type: 'unknown',
            description: 'The record data itself.',
          },
          author: {
            ref: 'lex:app.bsky.actor.defs#profileViewBasic',
            type: 'ref',
          },
          embeds: {
            type: 'array',
            items: {
              refs: [
                'lex:app.bsky.embed.images#view',
                'lex:app.bsky.embed.video#view',
                'lex:app.bsky.embed.gallery#view',
                'lex:app.bsky.embed.external#view',
                'lex:app.bsky.embed.record#view',
                'lex:app.bsky.embed.recordWithMedia#view',
              ],
              type: 'union',
            },
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          likeCount: {
            type: 'integer',
          },
          quoteCount: {
            type: 'integer',
          },
          replyCount: {
            type: 'integer',
          },
          repostCount: {
            type: 'integer',
          },
          opThreadPostCount: {
            type: 'integer',
            description:
              'The total number of posts in the contiguous OP thread that this post belongs to. Only present when this post is part of the OP thread.',
          },
          opThreadPostIndex: {
            type: 'integer',
            description:
              'The 1-indexed position of this post within the contiguous OP thread. Only present when this post is part of the OP thread.',
          },
        },
      },
      viewBlocked: {
        type: 'object',
        required: ['uri', 'blocked', 'author'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          author: {
            ref: 'lex:app.bsky.feed.defs#blockedAuthor',
            type: 'ref',
          },
          blocked: {
            type: 'boolean',
            const: true,
          },
        },
      },
      viewDetached: {
        type: 'object',
        required: ['uri', 'detached'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          detached: {
            type: 'boolean',
            const: true,
          },
        },
      },
      viewNotFound: {
        type: 'object',
        required: ['uri', 'notFound'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          notFound: {
            type: 'boolean',
            const: true,
          },
        },
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
    description:
      'A representation of a record embedded in a Bluesky record (eg, a post). For example, a quote-post, or sharing a feed generator record.',
  },
  AppBskyEmbedRecordWithMedia: {
    id: 'app.bsky.embed.recordWithMedia',
    defs: {
      main: {
        type: 'object',
        required: ['record', 'media'],
        properties: {
          media: {
            refs: [
              'lex:app.bsky.embed.images',
              'lex:app.bsky.embed.video',
              'lex:app.bsky.embed.gallery',
              'lex:app.bsky.embed.external',
            ],
            type: 'union',
          },
          record: {
            ref: 'lex:app.bsky.embed.record',
            type: 'ref',
          },
        },
      },
      view: {
        type: 'object',
        required: ['record', 'media'],
        properties: {
          media: {
            refs: [
              'lex:app.bsky.embed.images#view',
              'lex:app.bsky.embed.video#view',
              'lex:app.bsky.embed.gallery#view',
              'lex:app.bsky.embed.external#view',
            ],
            type: 'union',
          },
          record: {
            ref: 'lex:app.bsky.embed.record#view',
            type: 'ref',
          },
        },
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
    description:
      'A representation of a record embedded in a Bluesky record (eg, a post), alongside other compatible embeds. For example, a quote post and image, or a quote post and external URL card.',
  },
  AppBskyEmbedVideo: {
    id: 'app.bsky.embed.video',
    defs: {
      main: {
        type: 'object',
        required: ['video'],
        properties: {
          alt: {
            type: 'string',
            description:
              'Alt text description of the video, for accessibility.',
          },
          video: {
            type: 'blob',
            accept: ['video/mp4'],
            maxSize: 300000000,
            description:
              'The mp4 video file. May be up to 300mb, formerly limited to 100mb.',
          },
          captions: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.embed.video#caption',
              type: 'ref',
            },
            maxLength: 20,
          },
          aspectRatio: {
            ref: 'lex:app.bsky.embed.defs#aspectRatio',
            type: 'ref',
          },
          presentation: {
            type: 'string',
            description: 'A hint to the client about how to present the video.',
            knownValues: ['default', 'gif'],
          },
        },
      },
      view: {
        type: 'object',
        required: ['cid', 'playlist'],
        properties: {
          alt: {
            type: 'string',
          },
          cid: {
            type: 'string',
            format: 'cid',
          },
          playlist: {
            type: 'string',
            format: 'uri',
          },
          thumbnail: {
            type: 'string',
            format: 'uri',
          },
          aspectRatio: {
            ref: 'lex:app.bsky.embed.defs#aspectRatio',
            type: 'ref',
          },
          presentation: {
            type: 'string',
            description: 'A hint to the client about how to present the video.',
            knownValues: ['default', 'gif'],
          },
        },
      },
      caption: {
        type: 'object',
        required: ['lang', 'file'],
        properties: {
          file: {
            type: 'blob',
            accept: ['text/vtt'],
            maxSize: 20000,
          },
          lang: {
            type: 'string',
            format: 'language',
          },
        },
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
    description: 'A video embedded in a Bluesky record (eg, a post).',
  },
  AppBskyFeedDefs: {
    id: 'app.bsky.feed.defs',
    defs: {
      postView: {
        type: 'object',
        required: ['uri', 'cid', 'author', 'record', 'indexedAt'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          debug: {
            type: 'unknown',
            description: 'Debug information for internal development',
          },
          embed: {
            refs: [
              'lex:app.bsky.embed.images#view',
              'lex:app.bsky.embed.video#view',
              'lex:app.bsky.embed.gallery#view',
              'lex:app.bsky.embed.external#view',
              'lex:app.bsky.embed.record#view',
              'lex:app.bsky.embed.recordWithMedia#view',
            ],
            type: 'union',
          },
          author: {
            ref: 'lex:app.bsky.actor.defs#profileViewBasic',
            type: 'ref',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          record: {
            type: 'unknown',
          },
          viewer: {
            ref: 'lex:app.bsky.feed.defs#viewerState',
            type: 'ref',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          likeCount: {
            type: 'integer',
          },
          quoteCount: {
            type: 'integer',
          },
          replyCount: {
            type: 'integer',
          },
          threadgate: {
            ref: 'lex:app.bsky.feed.defs#threadgateView',
            type: 'ref',
          },
          repostCount: {
            type: 'integer',
          },
          bookmarkCount: {
            type: 'integer',
          },
        },
      },
      replyRef: {
        type: 'object',
        required: ['root', 'parent'],
        properties: {
          root: {
            refs: [
              'lex:app.bsky.feed.defs#postView',
              'lex:app.bsky.feed.defs#notFoundPost',
              'lex:app.bsky.feed.defs#blockedPost',
            ],
            type: 'union',
          },
          parent: {
            refs: [
              'lex:app.bsky.feed.defs#postView',
              'lex:app.bsky.feed.defs#notFoundPost',
              'lex:app.bsky.feed.defs#blockedPost',
            ],
            type: 'union',
          },
          grandparentAuthor: {
            ref: 'lex:app.bsky.actor.defs#profileViewBasic',
            type: 'ref',
            description:
              'When parent is a reply to another post, this is the author of that post.',
          },
        },
      },
      reasonPin: {
        type: 'object',
        properties: {},
      },
      blockedPost: {
        type: 'object',
        required: ['uri', 'blocked', 'author'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          author: {
            ref: 'lex:app.bsky.feed.defs#blockedAuthor',
            type: 'ref',
          },
          blocked: {
            type: 'boolean',
            const: true,
          },
        },
      },
      interaction: {
        type: 'object',
        properties: {
          item: {
            type: 'string',
            format: 'at-uri',
          },
          event: {
            type: 'string',
            knownValues: [
              'app.bsky.feed.defs#requestLess',
              'app.bsky.feed.defs#requestMore',
              'app.bsky.feed.defs#clickthroughItem',
              'app.bsky.feed.defs#clickthroughAuthor',
              'app.bsky.feed.defs#clickthroughReposter',
              'app.bsky.feed.defs#clickthroughEmbed',
              'app.bsky.feed.defs#interactionSeen',
              'app.bsky.feed.defs#interactionLike',
              'app.bsky.feed.defs#interactionRepost',
              'app.bsky.feed.defs#interactionReply',
              'app.bsky.feed.defs#interactionQuote',
              'app.bsky.feed.defs#interactionShare',
            ],
          },
          reqId: {
            type: 'string',
            maxLength: 100,
            description:
              'Unique identifier per request that may be passed back alongside interactions.',
          },
          feedContext: {
            type: 'string',
            maxLength: 2000,
            description:
              'Context on a feed item that was originally supplied by the feed generator on getFeedSkeleton.',
          },
        },
      },
      knownLikers: {
        type: 'object',
        required: ['count', 'actors'],
        properties: {
          count: {
            type: 'integer',
          },
          actors: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#profileViewBasic',
              type: 'ref',
            },
            maxLength: 5,
            minLength: 0,
          },
        },
        description: "The post's likers whom you also follow",
      },
      requestLess: {
        type: 'token',
        description:
          'Request that less content like the given feed item be shown in the feed',
      },
      requestMore: {
        type: 'token',
        description:
          'Request that more content like the given feed item be shown in the feed',
      },
      viewerState: {
        type: 'object',
        properties: {
          like: {
            type: 'string',
            format: 'at-uri',
          },
          pinned: {
            type: 'boolean',
          },
          repost: {
            type: 'string',
            format: 'at-uri',
          },
          bookmarked: {
            type: 'boolean',
          },
          knownLikers: {
            ref: 'lex:app.bsky.feed.defs#knownLikers',
            type: 'ref',
            description:
              'This property is present only in selected cases, as an optimization.',
          },
          threadMuted: {
            type: 'boolean',
          },
          replyDisabled: {
            type: 'boolean',
          },
          embeddingDisabled: {
            type: 'boolean',
          },
        },
        description:
          "Metadata about the requesting account's relationship with the subject content. Only has meaningful content for authed requests.",
      },
      feedViewPost: {
        type: 'object',
        required: ['post'],
        properties: {
          post: {
            ref: 'lex:app.bsky.feed.defs#postView',
            type: 'ref',
          },
          reply: {
            ref: 'lex:app.bsky.feed.defs#replyRef',
            type: 'ref',
          },
          reqId: {
            type: 'string',
            maxLength: 100,
            description:
              'Unique identifier per request that may be passed back alongside interactions.',
          },
          reason: {
            refs: [
              'lex:app.bsky.feed.defs#reasonRepost',
              'lex:app.bsky.feed.defs#reasonPin',
            ],
            type: 'union',
          },
          feedContext: {
            type: 'string',
            maxLength: 2000,
            description:
              'Context provided by feed generator that may be passed back alongside interactions.',
          },
          opThreadPostCount: {
            type: 'integer',
            description:
              'The total number of posts in the contiguous OP thread that this post belongs to. Only present when this post is part of the OP thread.',
          },
          opThreadPostIndex: {
            type: 'integer',
            description:
              'The 1-indexed position of this post within the contiguous OP thread. Only present when this post is part of the OP thread.',
          },
        },
      },
      notFoundPost: {
        type: 'object',
        required: ['uri', 'notFound'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          notFound: {
            type: 'boolean',
            const: true,
          },
        },
      },
      reasonRepost: {
        type: 'object',
        required: ['by', 'indexedAt'],
        properties: {
          by: {
            ref: 'lex:app.bsky.actor.defs#profileViewBasic',
            type: 'ref',
          },
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
        },
      },
      blockedAuthor: {
        type: 'object',
        required: ['did'],
        properties: {
          did: {
            type: 'string',
            format: 'did',
          },
          viewer: {
            ref: 'lex:app.bsky.actor.defs#viewerState',
            type: 'ref',
          },
        },
      },
      generatorView: {
        type: 'object',
        required: ['uri', 'cid', 'did', 'creator', 'displayName', 'indexedAt'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          did: {
            type: 'string',
            format: 'did',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          avatar: {
            type: 'string',
            format: 'uri',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          viewer: {
            ref: 'lex:app.bsky.feed.defs#generatorViewerState',
            type: 'ref',
          },
          creator: {
            ref: 'lex:app.bsky.actor.defs#profileView',
            type: 'ref',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          likeCount: {
            type: 'integer',
            minimum: 0,
          },
          contentMode: {
            type: 'string',
            knownValues: [
              'app.bsky.feed.defs#contentModeUnspecified',
              'app.bsky.feed.defs#contentModeVideo',
            ],
          },
          description: {
            type: 'string',
            maxLength: 3000,
            maxGraphemes: 300,
          },
          displayName: {
            type: 'string',
          },
          descriptionFacets: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.richtext.facet',
              type: 'ref',
            },
          },
          acceptsInteractions: {
            type: 'boolean',
          },
        },
      },
      threadContext: {
        type: 'object',
        properties: {
          rootAuthorLike: {
            type: 'string',
            format: 'at-uri',
          },
        },
        description:
          'Metadata about this post within the context of the thread it is in.',
      },
      threadViewPost: {
        type: 'object',
        required: ['post'],
        properties: {
          post: {
            ref: 'lex:app.bsky.feed.defs#postView',
            type: 'ref',
          },
          parent: {
            refs: [
              'lex:app.bsky.feed.defs#threadViewPost',
              'lex:app.bsky.feed.defs#notFoundPost',
              'lex:app.bsky.feed.defs#blockedPost',
            ],
            type: 'union',
          },
          replies: {
            type: 'array',
            items: {
              refs: [
                'lex:app.bsky.feed.defs#threadViewPost',
                'lex:app.bsky.feed.defs#notFoundPost',
                'lex:app.bsky.feed.defs#blockedPost',
              ],
              type: 'union',
            },
          },
          threadContext: {
            ref: 'lex:app.bsky.feed.defs#threadContext',
            type: 'ref',
          },
        },
      },
      threadgateView: {
        type: 'object',
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          lists: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.graph.defs#listViewBasic',
              type: 'ref',
            },
          },
          record: {
            type: 'unknown',
          },
        },
      },
      interactionLike: {
        type: 'token',
        description: 'User liked the feed item',
      },
      interactionSeen: {
        type: 'token',
        description: 'Feed item was seen by user',
      },
      clickthroughItem: {
        type: 'token',
        description: 'User clicked through to the feed item',
      },
      contentModeVideo: {
        type: 'token',
        description:
          'Declares the feed generator returns posts containing app.bsky.embed.video embeds.',
      },
      interactionQuote: {
        type: 'token',
        description: 'User quoted the feed item',
      },
      interactionReply: {
        type: 'token',
        description: 'User replied to the feed item',
      },
      interactionShare: {
        type: 'token',
        description: 'User shared the feed item',
      },
      skeletonFeedPost: {
        type: 'object',
        required: ['post'],
        properties: {
          post: {
            type: 'string',
            format: 'at-uri',
          },
          reason: {
            refs: [
              'lex:app.bsky.feed.defs#skeletonReasonRepost',
              'lex:app.bsky.feed.defs#skeletonReasonPin',
            ],
            type: 'union',
          },
          feedContext: {
            type: 'string',
            maxLength: 2000,
            description:
              'Context that will be passed through to client and may be passed to feed generator back alongside interactions.',
          },
        },
      },
      clickthroughEmbed: {
        type: 'token',
        description:
          'User clicked through to the embedded content of the feed item',
      },
      interactionRepost: {
        type: 'token',
        description: 'User reposted the feed item',
      },
      skeletonReasonPin: {
        type: 'object',
        properties: {},
      },
      clickthroughAuthor: {
        type: 'token',
        description: 'User clicked through to the author of the feed item',
      },
      clickthroughReposter: {
        type: 'token',
        description: 'User clicked through to the reposter of the feed item',
      },
      generatorViewerState: {
        type: 'object',
        properties: {
          like: {
            type: 'string',
            format: 'at-uri',
          },
        },
      },
      skeletonReasonRepost: {
        type: 'object',
        required: ['repost'],
        properties: {
          repost: {
            type: 'string',
            format: 'at-uri',
          },
        },
      },
      contentModeUnspecified: {
        type: 'token',
        description: 'Declares the feed generator returns any types of posts.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  AppBskyFeedPostgate: {
    id: 'app.bsky.feed.postgate',
    defs: {
      main: {
        key: 'tid',
        type: 'record',
        record: {
          type: 'object',
          required: ['post', 'createdAt'],
          properties: {
            post: {
              type: 'string',
              format: 'at-uri',
              description: 'Reference (AT-URI) to the post record.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
            embeddingRules: {
              type: 'array',
              items: {
                refs: ['lex:app.bsky.feed.postgate#disableRule'],
                type: 'union',
              },
              maxLength: 5,
              description:
                'List of rules defining who can embed this post. If value is an empty array or is undefined, no particular rules apply and anyone can embed.',
            },
            detachedEmbeddingUris: {
              type: 'array',
              items: {
                type: 'string',
                format: 'at-uri',
              },
              maxLength: 50,
              description:
                'List of AT-URIs embedding this post that the author has detached from.',
            },
          },
        },
        description:
          'Record defining interaction rules for a post. The record key (rkey) of the postgate record must match the record key of the post, and that record must be in the same repository.',
      },
      disableRule: {
        type: 'object',
        properties: {},
        description: 'Disables embedding of this post.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  AppBskyFeedThreadgate: {
    id: 'app.bsky.feed.threadgate',
    defs: {
      main: {
        key: 'tid',
        type: 'record',
        record: {
          type: 'object',
          required: ['post', 'createdAt'],
          properties: {
            post: {
              type: 'string',
              format: 'at-uri',
              description: 'Reference (AT-URI) to the post record.',
            },
            allow: {
              type: 'array',
              items: {
                refs: [
                  'lex:app.bsky.feed.threadgate#mentionRule',
                  'lex:app.bsky.feed.threadgate#followerRule',
                  'lex:app.bsky.feed.threadgate#followingRule',
                  'lex:app.bsky.feed.threadgate#listRule',
                ],
                type: 'union',
              },
              maxLength: 5,
              description:
                'List of rules defining who can reply to this post. If value is an empty array, no one can reply. If value is undefined, anyone can reply.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
            hiddenReplies: {
              type: 'array',
              items: {
                type: 'string',
                format: 'at-uri',
              },
              maxLength: 300,
              description: 'List of hidden reply URIs.',
            },
          },
        },
        description:
          "Record defining interaction gating rules for a thread (aka, reply controls). The record key (rkey) of the threadgate record must match the record key of the thread's root post, and that record must be in the same repository.",
      },
      listRule: {
        type: 'object',
        required: ['list'],
        properties: {
          list: {
            type: 'string',
            format: 'at-uri',
          },
        },
        description: 'Allow replies from actors on a list.',
      },
      mentionRule: {
        type: 'object',
        properties: {},
        description: 'Allow replies from actors mentioned in your post.',
      },
      followerRule: {
        type: 'object',
        properties: {},
        description: 'Allow replies from actors who follow you.',
      },
      followingRule: {
        type: 'object',
        properties: {},
        description: 'Allow replies from actors you follow.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  AppBskyGraphDefs: {
    id: 'app.bsky.graph.defs',
    defs: {
      modlist: {
        type: 'token',
        description:
          'A list of actors to apply an aggregate moderation action (mute/block) on.',
      },
      listView: {
        type: 'object',
        required: ['uri', 'cid', 'creator', 'name', 'purpose', 'indexedAt'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          name: {
            type: 'string',
            maxLength: 64,
            minLength: 1,
          },
          avatar: {
            type: 'string',
            format: 'uri',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          viewer: {
            ref: 'lex:app.bsky.graph.defs#listViewerState',
            type: 'ref',
          },
          creator: {
            ref: 'lex:app.bsky.actor.defs#profileView',
            type: 'ref',
          },
          purpose: {
            ref: 'lex:app.bsky.graph.defs#listPurpose',
            type: 'ref',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          description: {
            type: 'string',
            maxLength: 3000,
            maxGraphemes: 300,
          },
          listItemCount: {
            type: 'integer',
            minimum: 0,
          },
          descriptionFacets: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.richtext.facet',
              type: 'ref',
            },
          },
        },
      },
      curatelist: {
        type: 'token',
        description:
          'A list of actors used for curation purposes such as list feeds or interaction gating.',
      },
      listPurpose: {
        type: 'string',
        knownValues: [
          'app.bsky.graph.defs#modlist',
          'app.bsky.graph.defs#curatelist',
          'app.bsky.graph.defs#referencelist',
        ],
      },
      listItemView: {
        type: 'object',
        required: ['uri', 'subject'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          subject: {
            ref: 'lex:app.bsky.actor.defs#profileView',
            type: 'ref',
          },
          subjectOptedOut: {
            type: 'boolean',
            const: true,
            description:
              'Set to true when the subject has opted out of appearing in the reference list. Only set when the viewer owns the list.',
          },
        },
      },
      relationship: {
        type: 'object',
        required: ['did'],
        properties: {
          did: {
            type: 'string',
            format: 'did',
          },
          blocking: {
            type: 'string',
            format: 'at-uri',
            description:
              'if the actor blocks this DID, this is the AT-URI of the block record',
          },
          blockedBy: {
            type: 'string',
            format: 'at-uri',
            description:
              'if the actor is blocked by this DID, contains the AT-URI of the block record',
          },
          following: {
            type: 'string',
            format: 'at-uri',
            description:
              'if the actor follows this DID, this is the AT-URI of the follow record',
          },
          followedBy: {
            type: 'string',
            format: 'at-uri',
            description:
              'if the actor is followed by this DID, contains the AT-URI of the follow record',
          },
          blockedByList: {
            type: 'string',
            format: 'at-uri',
            description:
              'if the actor is blocked by this DID via a block list, contains the AT-URI of the listblock record',
          },
          blockingByList: {
            type: 'string',
            format: 'at-uri',
            description:
              'if the actor blocks this DID via a block list, this is the AT-URI of the listblock record',
          },
        },
        description:
          'lists the bi-directional graph relationships between one actor (not indicated in the object), and the target actors (the DID included in the object)',
      },
      listViewBasic: {
        type: 'object',
        required: ['uri', 'cid', 'name', 'purpose'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          name: {
            type: 'string',
            maxLength: 64,
            minLength: 1,
          },
          avatar: {
            type: 'string',
            format: 'uri',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          viewer: {
            ref: 'lex:app.bsky.graph.defs#listViewerState',
            type: 'ref',
          },
          purpose: {
            ref: 'lex:app.bsky.graph.defs#listPurpose',
            type: 'ref',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          listItemCount: {
            type: 'integer',
            minimum: 0,
          },
        },
      },
      notFoundActor: {
        type: 'object',
        required: ['actor', 'notFound'],
        properties: {
          actor: {
            type: 'string',
            format: 'at-identifier',
          },
          notFound: {
            type: 'boolean',
            const: true,
          },
        },
        description: 'indicates that a handle or DID could not be resolved',
      },
      referencelist: {
        type: 'token',
        description:
          'A list of actors used for only for reference purposes such as within a starter pack.',
      },
      listViewerState: {
        type: 'object',
        properties: {
          muted: {
            type: 'boolean',
          },
          blocked: {
            type: 'string',
            format: 'at-uri',
          },
          referenceListOptOut: {
            type: 'string',
            format: 'at-uri',
            description:
              "The authenticated viewer's app.bsky.graph.referencelistoptout record URI for this reference list. Only set for reference lists. A client can delete this record to undo the opt-out.",
          },
        },
      },
      starterPackView: {
        type: 'object',
        required: ['uri', 'cid', 'record', 'creator', 'indexedAt'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          list: {
            ref: 'lex:app.bsky.graph.defs#listViewBasic',
            type: 'ref',
          },
          feeds: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.feed.defs#generatorView',
              type: 'ref',
            },
            maxLength: 3,
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          record: {
            type: 'unknown',
          },
          creator: {
            ref: 'lex:app.bsky.actor.defs#profileViewBasic',
            type: 'ref',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          joinedWeekCount: {
            type: 'integer',
            minimum: 0,
          },
          listItemsSample: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.graph.defs#listItemView',
              type: 'ref',
            },
            maxLength: 12,
          },
          joinedAllTimeCount: {
            type: 'integer',
            minimum: 0,
          },
        },
      },
      starterPackViewBasic: {
        type: 'object',
        required: ['uri', 'cid', 'record', 'creator', 'indexedAt'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          record: {
            type: 'unknown',
          },
          creator: {
            ref: 'lex:app.bsky.actor.defs#profileViewBasic',
            type: 'ref',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          listItemCount: {
            type: 'integer',
            minimum: 0,
          },
          joinedWeekCount: {
            type: 'integer',
            minimum: 0,
          },
          joinedAllTimeCount: {
            type: 'integer',
            minimum: 0,
          },
        },
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  AppBskyLabelerDefs: {
    id: 'app.bsky.labeler.defs',
    defs: {
      labelerView: {
        type: 'object',
        required: ['uri', 'cid', 'creator', 'indexedAt'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          viewer: {
            ref: 'lex:app.bsky.labeler.defs#labelerViewerState',
            type: 'ref',
          },
          creator: {
            ref: 'lex:app.bsky.actor.defs#profileView',
            type: 'ref',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          likeCount: {
            type: 'integer',
            minimum: 0,
          },
        },
      },
      labelerPolicies: {
        type: 'object',
        required: ['labelValues'],
        properties: {
          labelValues: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#labelValue',
              type: 'ref',
            },
            description:
              'The label values which this labeler publishes. May include global or custom labels.',
          },
          labelValueDefinitions: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#labelValueDefinition',
              type: 'ref',
            },
            description:
              'Label values created by this labeler and scoped exclusively to it. Labels defined here will override global label definitions for this labeler.',
          },
        },
      },
      labelerViewerState: {
        type: 'object',
        properties: {
          like: {
            type: 'string',
            format: 'at-uri',
          },
        },
      },
      labelerViewDetailed: {
        type: 'object',
        required: ['uri', 'cid', 'creator', 'policies', 'indexedAt'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          labels: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#label',
              type: 'ref',
            },
          },
          viewer: {
            ref: 'lex:app.bsky.labeler.defs#labelerViewerState',
            type: 'ref',
          },
          creator: {
            ref: 'lex:app.bsky.actor.defs#profileView',
            type: 'ref',
          },
          policies: {
            ref: 'lex:app.bsky.labeler.defs#labelerPolicies',
            type: 'ref',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          likeCount: {
            type: 'integer',
            minimum: 0,
          },
          reasonTypes: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.moderation.defs#reasonType',
              type: 'ref',
            },
            description:
              "The set of report reason 'codes' which are in-scope for this service to review and action. These usually align to policy categories. If not defined (distinct from empty array), all reason types are allowed.",
          },
          subjectTypes: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.moderation.defs#subjectType',
              type: 'ref',
            },
            description:
              'The set of subject types (account, record, etc) this service accepts reports on.',
          },
          subjectCollections: {
            type: 'array',
            items: {
              type: 'string',
              format: 'nsid',
            },
            description:
              'Set of record types (collection NSIDs) which can be reported to this service. If not defined (distinct from empty array), default is any record type.',
          },
        },
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  AppBskyNotificationDefs: {
    id: 'app.bsky.notification.defs',
    defs: {
      preference: {
        type: 'object',
        required: ['list', 'push'],
        properties: {
          list: {
            type: 'boolean',
          },
          push: {
            type: 'boolean',
          },
        },
      },
      preferences: {
        type: 'object',
        required: [
          'chat',
          'follow',
          'like',
          'likeViaRepost',
          'mention',
          'quote',
          'reply',
          'repost',
          'repostViaRepost',
          'starterpackJoined',
          'subscribedPost',
          'unverified',
          'verified',
        ],
        properties: {
          chat: {
            ref: 'lex:app.bsky.notification.defs#chatPreference',
            type: 'ref',
            description:
              'Deprecated: use chat.bsky.notification preferences instead. This will only return a default value.',
          },
          like: {
            ref: 'lex:app.bsky.notification.defs#filterablePreference',
            type: 'ref',
          },
          quote: {
            ref: 'lex:app.bsky.notification.defs#filterablePreference',
            type: 'ref',
          },
          reply: {
            ref: 'lex:app.bsky.notification.defs#filterablePreference',
            type: 'ref',
          },
          follow: {
            ref: 'lex:app.bsky.notification.defs#filterablePreference',
            type: 'ref',
          },
          repost: {
            ref: 'lex:app.bsky.notification.defs#filterablePreference',
            type: 'ref',
          },
          mention: {
            ref: 'lex:app.bsky.notification.defs#filterablePreference',
            type: 'ref',
          },
          verified: {
            ref: 'lex:app.bsky.notification.defs#preference',
            type: 'ref',
          },
          unverified: {
            ref: 'lex:app.bsky.notification.defs#preference',
            type: 'ref',
          },
          likeViaRepost: {
            ref: 'lex:app.bsky.notification.defs#filterablePreference',
            type: 'ref',
          },
          subscribedPost: {
            ref: 'lex:app.bsky.notification.defs#preference',
            type: 'ref',
          },
          repostViaRepost: {
            ref: 'lex:app.bsky.notification.defs#filterablePreference',
            type: 'ref',
          },
          starterpackJoined: {
            ref: 'lex:app.bsky.notification.defs#preference',
            type: 'ref',
          },
        },
      },
      recordDeleted: {
        type: 'object',
        properties: {},
      },
      chatPreference: {
        type: 'object',
        required: ['include', 'push'],
        properties: {
          push: {
            type: 'boolean',
          },
          include: {
            type: 'string',
            knownValues: ['all', 'accepted'],
          },
        },
        description:
          'Deprecated: use chat.bsky.notification preferences instead. This will only return a default value.',
      },
      activitySubscription: {
        type: 'object',
        required: ['post', 'reply'],
        properties: {
          post: {
            type: 'boolean',
          },
          reply: {
            type: 'boolean',
          },
        },
      },
      filterablePreference: {
        type: 'object',
        required: ['include', 'list', 'push'],
        properties: {
          list: {
            type: 'boolean',
          },
          push: {
            type: 'boolean',
          },
          include: {
            type: 'string',
            knownValues: ['all', 'follows'],
          },
        },
      },
      subjectActivitySubscription: {
        type: 'object',
        required: ['subject', 'activitySubscription'],
        properties: {
          subject: {
            type: 'string',
            format: 'did',
          },
          activitySubscription: {
            ref: 'lex:app.bsky.notification.defs#activitySubscription',
            type: 'ref',
          },
        },
        description:
          'Object used to store activity subscription data in stash.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  AppBskyRichtextFacet: {
    id: 'app.bsky.richtext.facet',
    defs: {
      tag: {
        type: 'object',
        required: ['tag'],
        properties: {
          tag: {
            type: 'string',
            maxLength: 640,
            maxGraphemes: 64,
          },
        },
        description:
          "Facet feature for a hashtag. The text usually includes a '#' prefix, but the facet reference should not (except in the case of 'double hash tags').",
      },
      link: {
        type: 'object',
        required: ['uri'],
        properties: {
          uri: {
            type: 'string',
            format: 'uri',
          },
        },
        description:
          'Facet feature for a URL. The text URL may have been simplified or truncated, but the facet reference should be a complete URL.',
      },
      main: {
        type: 'object',
        required: ['index', 'features'],
        properties: {
          index: {
            ref: 'lex:app.bsky.richtext.facet#byteSlice',
            type: 'ref',
          },
          features: {
            type: 'array',
            items: {
              refs: [
                'lex:app.bsky.richtext.facet#mention',
                'lex:app.bsky.richtext.facet#link',
                'lex:app.bsky.richtext.facet#tag',
              ],
              type: 'union',
            },
          },
        },
        description: 'Annotation of a sub-string within rich text.',
      },
      mention: {
        type: 'object',
        required: ['did'],
        properties: {
          did: {
            type: 'string',
            format: 'did',
          },
        },
        description:
          "Facet feature for mention of another account. The text is usually a handle, including a '@' prefix, but the facet reference is a DID.",
      },
      byteSlice: {
        type: 'object',
        required: ['byteStart', 'byteEnd'],
        properties: {
          byteEnd: {
            type: 'integer',
            minimum: 0,
          },
          byteStart: {
            type: 'integer',
            minimum: 0,
          },
        },
        description:
          'Specifies the sub-string range a facet feature applies to. Start index is inclusive, end index is exclusive. Indices are zero-indexed, counting bytes of the UTF-8 encoded text. NOTE: some languages, like Javascript, use UTF-16 or Unicode codepoints for string slice indexing; in these languages, convert to byte arrays before working with facets.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  ComAtprotoLabelDefs: {
    id: 'com.atproto.label.defs',
    defs: {
      label: {
        type: 'object',
        required: ['src', 'uri', 'val', 'cts'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
            description:
              "Optionally, CID specifying the specific version of 'uri' resource this label applies to.",
          },
          cts: {
            type: 'string',
            format: 'datetime',
            description: 'Timestamp when this label was created.',
          },
          exp: {
            type: 'string',
            format: 'datetime',
            description:
              'Timestamp at which this label expires (no longer applies).',
          },
          neg: {
            type: 'boolean',
            description:
              'If true, this is a negation label, overwriting a previous label.',
          },
          sig: {
            type: 'bytes',
            description: 'Signature of dag-cbor encoded label.',
          },
          src: {
            type: 'string',
            format: 'did',
            description: 'DID of the actor who created this label.',
          },
          uri: {
            type: 'string',
            format: 'uri',
            description:
              'AT URI of the record, repository (account), or other resource that this label applies to.',
          },
          val: {
            type: 'string',
            maxLength: 128,
            description:
              'The short string name of the value or type of this label.',
          },
          ver: {
            type: 'integer',
            description: 'The AT Protocol version of the label object.',
          },
        },
        description:
          'Metadata tag on an atproto resource (eg, repo or record).',
      },
      selfLabel: {
        type: 'object',
        required: ['val'],
        properties: {
          val: {
            type: 'string',
            maxLength: 128,
            description:
              'The short string name of the value or type of this label.',
          },
        },
        description:
          'Metadata tag on an atproto record, published by the author within the record. Note that schemas should use #selfLabels, not #selfLabel.',
      },
      labelValue: {
        type: 'string',
        knownValues: [
          '!hide',
          '!warn',
          '!no-unauthenticated',
          'porn',
          'sexual',
          'nudity',
          'graphic-media',
          'bot',
        ],
      },
      selfLabels: {
        type: 'object',
        required: ['values'],
        properties: {
          values: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#selfLabel',
              type: 'ref',
            },
            maxLength: 10,
          },
        },
        description:
          'Metadata tags on an atproto record, published by the author within the record.',
      },
      labelValueDefinition: {
        type: 'object',
        required: ['identifier', 'severity', 'blurs', 'locales'],
        properties: {
          blurs: {
            type: 'string',
            description:
              "What should this label hide in the UI, if applied? 'content' hides all of the target; 'media' hides the images/video/audio; 'none' hides nothing.",
            knownValues: ['content', 'media', 'none'],
          },
          locales: {
            type: 'array',
            items: {
              ref: 'lex:com.atproto.label.defs#labelValueDefinitionStrings',
              type: 'ref',
            },
          },
          severity: {
            type: 'string',
            description:
              "How should a client visually convey this label? 'inform' means neutral and informational; 'alert' means negative and warning; 'none' means show nothing.",
            knownValues: ['inform', 'alert', 'none'],
          },
          adultOnly: {
            type: 'boolean',
            description:
              'Does the user need to have adult content enabled in order to configure this label?',
          },
          identifier: {
            type: 'string',
            maxLength: 100,
            description:
              "The value of the label being defined. Must only include lowercase ascii and the '-' character ([a-z-]+).",
            maxGraphemes: 100,
          },
          defaultSetting: {
            type: 'string',
            default: 'warn',
            description: 'The default setting for this label.',
            knownValues: ['ignore', 'warn', 'hide'],
          },
        },
        description:
          'Declares a label value and its expected interpretations and behaviors.',
      },
      labelValueDefinitionStrings: {
        type: 'object',
        required: ['lang', 'name', 'description'],
        properties: {
          lang: {
            type: 'string',
            format: 'language',
            description:
              'The code of the language these strings are written in.',
          },
          name: {
            type: 'string',
            maxLength: 640,
            description: 'A short human-readable name for the label.',
            maxGraphemes: 64,
          },
          description: {
            type: 'string',
            maxLength: 100000,
            description:
              'A longer description of what the label means and why it might be applied.',
            maxGraphemes: 10000,
          },
        },
        description:
          'Strings which describe the label in the UI, localized into a specific language.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  ComAtprotoModerationDefs: {
    id: 'com.atproto.moderation.defs',
    defs: {
      reasonRude: {
        type: 'token',
        description:
          'Rude, harassing, explicit, or otherwise unwelcoming behavior. Prefer new lexicon definition `tools.ozone.report.defs#reasonHarassmentOther`.',
      },
      reasonSpam: {
        type: 'token',
        description:
          'Spam: frequent unwanted promotion, replies, mentions. Prefer new lexicon definition `tools.ozone.report.defs#reasonMisleadingSpam`.',
      },
      reasonType: {
        type: 'string',
        knownValues: [
          'com.atproto.moderation.defs#reasonSpam',
          'com.atproto.moderation.defs#reasonViolation',
          'com.atproto.moderation.defs#reasonMisleading',
          'com.atproto.moderation.defs#reasonSexual',
          'com.atproto.moderation.defs#reasonRude',
          'com.atproto.moderation.defs#reasonOther',
          'com.atproto.moderation.defs#reasonAppeal',
          'tools.ozone.report.defs#reasonAppeal',
          'tools.ozone.report.defs#reasonOther',
          'tools.ozone.report.defs#reasonViolenceAnimal',
          'tools.ozone.report.defs#reasonViolenceThreats',
          'tools.ozone.report.defs#reasonViolenceGraphicContent',
          'tools.ozone.report.defs#reasonViolenceGlorification',
          'tools.ozone.report.defs#reasonViolenceExtremistContent',
          'tools.ozone.report.defs#reasonViolenceTrafficking',
          'tools.ozone.report.defs#reasonViolenceOther',
          'tools.ozone.report.defs#reasonSexualAbuseContent',
          'tools.ozone.report.defs#reasonSexualNCII',
          'tools.ozone.report.defs#reasonSexualDeepfake',
          'tools.ozone.report.defs#reasonSexualAnimal',
          'tools.ozone.report.defs#reasonSexualUnlabeled',
          'tools.ozone.report.defs#reasonSexualOther',
          'tools.ozone.report.defs#reasonChildSafetyCSAM',
          'tools.ozone.report.defs#reasonChildSafetyGroom',
          'tools.ozone.report.defs#reasonChildSafetyPrivacy',
          'tools.ozone.report.defs#reasonChildSafetyHarassment',
          'tools.ozone.report.defs#reasonChildSafetyOther',
          'tools.ozone.report.defs#reasonHarassmentTroll',
          'tools.ozone.report.defs#reasonHarassmentTargeted',
          'tools.ozone.report.defs#reasonHarassmentHateSpeech',
          'tools.ozone.report.defs#reasonHarassmentDoxxing',
          'tools.ozone.report.defs#reasonHarassmentOther',
          'tools.ozone.report.defs#reasonMisleadingBot',
          'tools.ozone.report.defs#reasonMisleadingImpersonation',
          'tools.ozone.report.defs#reasonMisleadingSpam',
          'tools.ozone.report.defs#reasonMisleadingScam',
          'tools.ozone.report.defs#reasonMisleadingElections',
          'tools.ozone.report.defs#reasonMisleadingOther',
          'tools.ozone.report.defs#reasonRuleSiteSecurity',
          'tools.ozone.report.defs#reasonRuleProhibitedSales',
          'tools.ozone.report.defs#reasonRuleBanEvasion',
          'tools.ozone.report.defs#reasonRuleOther',
          'tools.ozone.report.defs#reasonSelfHarmContent',
          'tools.ozone.report.defs#reasonSelfHarmED',
          'tools.ozone.report.defs#reasonSelfHarmStunts',
          'tools.ozone.report.defs#reasonSelfHarmSubstances',
          'tools.ozone.report.defs#reasonSelfHarmOther',
        ],
      },
      reasonOther: {
        type: 'token',
        description:
          'Reports not falling under another report category. Prefer new lexicon definition `tools.ozone.report.defs#reasonOther`.',
      },
      subjectType: {
        type: 'string',
        description: 'Tag describing a type of subject that might be reported.',
        knownValues: ['account', 'record', 'chat'],
      },
      reasonAppeal: {
        type: 'token',
        description: 'Appeal a previously taken moderation action',
      },
      reasonSexual: {
        type: 'token',
        description:
          'Unwanted or mislabeled sexual content. Prefer new lexicon definition `tools.ozone.report.defs#reasonSexualUnlabeled`.',
      },
      reasonViolation: {
        type: 'token',
        description:
          'Direct violation of server rules, laws, terms of service. Prefer new lexicon definition `tools.ozone.report.defs#reasonRuleOther`.',
      },
      reasonMisleading: {
        type: 'token',
        description:
          'Misleading identity, affiliation, or content. Prefer new lexicon definition `tools.ozone.report.defs#reasonMisleadingOther`.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  ComAtprotoRepoStrongRef: {
    id: 'com.atproto.repo.strongRef',
    defs: {
      main: {
        type: 'object',
        required: ['uri', 'cid'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
        },
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
    description: 'A URI with a content-hash fingerprint.',
  },
  WinTomoXRogainingApprove: {
    id: 'win.tomo-x.rogaining.approve',
    defs: {
      main: {
        key: 'tid',
        type: 'record',
        record: {
          type: 'object',
          required: ['submit', 'createdAt'],
          properties: {
            submit: {
              ref: 'lex:com.atproto.repo.strongRef',
              type: 'ref',
              description: 'The submission being approved.',
            },
            reason: {
              type: 'string',
              maxLength: 3000,
              maxGraphemes: 300,
              description: 'A comment on the approval, shown to the team.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'When the submission was approved.',
            },
          },
        },
        description:
          "An event approver's approval of a participant's checkpoint submission. Only valid when created by the DID in the event's approver field or by the event's author. See submissionView.status for how approve and reject records are resolved.",
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  WinTomoXRogainingCheckpoint: {
    id: 'win.tomo-x.rogaining.checkpoint',
    defs: {
      main: {
        key: 'tid',
        type: 'record',
        record: {
          type: 'object',
          required: [
            'event',
            'name',
            'point',
            'location',
            'createdAt',
            'image',
            'internalImages',
          ],
          properties: {
            name: {
              type: 'string',
              maxLength: 1000,
              maxGraphemes: 100,
            },
            event: {
              ref: 'lex:com.atproto.repo.strongRef',
              type: 'ref',
              description: 'The event this checkpoint belongs to.',
            },
            point: {
              type: 'integer',
              minimum: 0,
              description: 'Score awarded for reaching this checkpoint.',
            },
            location: {
              ref: 'lex:win.tomo-x.rogaining.defs#location',
              type: 'ref',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
            description: {
              type: 'string',
              maxLength: 10000,
              maxGraphemes: 1000,
            },
            radiusMeters: {
              type: 'integer',
              default: 30,
              minimum: 1,
              description:
                'Allowed distance from the location for a valid submission.',
            },
            isGoal: {
              type: 'boolean',
              default: false,
              description:
                'Whether this checkpoint is the event finish. Goal submissions are not judged.',
            },
            image: {
              type: 'blob',
              accept: ['image/png', 'image/jpeg', 'image/webp'],
              maxSize: 2000000,
              description: 'Image of the checkpoint.',
            },
            internalImages: {
              type: 'array',
              items: {
                type: 'blob',
                accept: ['image/png', 'image/jpeg', 'image/webp'],
                maxSize: 2000000,
              },
              maxLength: 10,
              description:
                'Internal images of the checkpoint, not shown to participants.',
            },
          },
        },
        description: 'A checkpoint belonging to a rogaining event.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  WinTomoXRogainingDefs: {
    id: 'win.tomo-x.rogaining.defs',
    defs: {
      location: {
        type: 'object',
        required: ['latitude', 'longitude'],
        properties: {
          latitude: {
            type: 'string',
            maxLength: 20,
          },
          longitude: {
            type: 'string',
            maxLength: 20,
          },
        },
        description:
          'Coordinates as decimal degrees encoded as strings (lexicon has no float type), e.g. "35.681236".',
      },
      teamView: {
        type: 'object',
        required: ['uri', 'cid', 'record', 'members', 'indexedAt'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          record: {
            type: 'unknown',
            description: 'The win.tomo-x.rogaining.team record.',
          },
          members: {
            type: 'array',
            items: {
              ref: 'lex:app.bsky.actor.defs#profileViewBasic',
              type: 'ref',
            },
            description: 'Profiles of the team members.',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
        },
      },
      eventView: {
        type: 'object',
        required: ['uri', 'cid', 'author', 'record', 'indexedAt'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          author: {
            ref: 'lex:app.bsky.actor.defs#profileViewBasic',
            type: 'ref',
          },
          record: {
            type: 'unknown',
            description: 'The win.tomo-x.rogaining.event record.',
          },
          approver: {
            ref: 'lex:app.bsky.actor.defs#profileViewBasic',
            type: 'ref',
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          teamCount: {
            type: 'integer',
            minimum: 0,
          },
          checkpointCount: {
            type: 'integer',
            minimum: 0,
          },
          participantCount: {
            type: 'integer',
            minimum: 0,
          },
        },
      },
      rankingEntry: {
        type: 'object',
        required: ['team', 'rank', 'totalPoints', 'approvedCount'],
        properties: {
          rank: {
            type: 'integer',
            minimum: 1,
          },
          team: {
            ref: 'lex:win.tomo-x.rogaining.defs#teamView',
            type: 'ref',
          },
          totalPoints: {
            type: 'integer',
            minimum: 0,
            description:
              "Sum of approved checkpoint points and the team's finish-time bonus.",
          },
          approvedCount: {
            type: 'integer',
            minimum: 0,
            description:
              'Number of distinct non-goal checkpoints with an approved submission.',
          },
        },
      },
      checkpointView: {
        type: 'object',
        required: ['uri', 'cid', 'record', 'indexedAt'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          record: {
            type: 'unknown',
            description: 'The win.tomo-x.rogaining.checkpoint record.',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
            description: 'URL of the checkpoint image.',
          },
          internalImageUrls: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uri',
            },
            maxLength: 10,
            description:
              "URLs of the internal images. Only returned to the event's author.",
          },
        },
      },
      submissionView: {
        type: 'object',
        required: [
          'uri',
          'cid',
          'author',
          'team',
          'record',
          'status',
          'indexedAt',
        ],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          author: {
            ref: 'lex:app.bsky.actor.defs#profileViewBasic',
            type: 'ref',
          },
          team: {
            type: 'string',
            format: 'at-uri',
            description: 'The team the author belongs to in this event.',
          },
          record: {
            type: 'unknown',
            description: 'The win.tomo-x.rogaining.submit record.',
          },
          status: {
            type: 'string',
            description:
              "Decided by one valid approve or reject record for the submission's current cid, made by the event's author or approver. The author's records take precedence over the approver's; among one account's records, the one with the newest createdAt wins. approved or rejected by that record, otherwise pending. Only approved submissions count for the ranking.",
            knownValues: ['pending', 'approved', 'rejected'],
          },
          photoUrl: {
            type: 'string',
            format: 'uri',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          approvalUri: {
            type: 'string',
            format: 'at-uri',
            description: 'AT-URI of the approve record, if approved.',
          },
          rejectionUri: {
            type: 'string',
            format: 'at-uri',
            description: 'AT-URI of the reject record, if rejected.',
          },
          reason: {
            type: 'string',
            description:
              'The reason of the approve or reject record that decided the status.',
          },
          distanceMeters: {
            type: 'integer',
            minimum: 0,
            description:
              "Distance between the submitted location and the checkpoint, for the approver's review.",
          },
          withinEventPeriod: {
            type: 'boolean',
            description:
              "Whether the submission's createdAt is between the event's startsAt and endsAt, for the approver's review.",
          },
        },
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  WinTomoXRogainingEvent: {
    id: 'win.tomo-x.rogaining.event',
    defs: {
      main: {
        key: 'tid',
        type: 'record',
        record: {
          type: 'object',
          required: ['name', 'startsAt', 'endsAt', 'createdAt', 'approver'],
          properties: {
            name: {
              type: 'string',
              maxLength: 1000,
              maxGraphemes: 100,
            },
            image: {
              type: 'blob',
              accept: ['image/png', 'image/jpeg', 'image/webp'],
              maxSize: 1000000,
            },
            endsAt: {
              type: 'string',
              format: 'datetime',
              description: 'When the event ends.',
            },
            approver: {
              type: 'string',
              format: 'did',
              description:
                'The DID of the user who can approve submissions for this event.',
            },
            startsAt: {
              type: 'string',
              format: 'datetime',
              description: 'When the event starts.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
            description: {
              type: 'string',
              maxLength: 30000,
              maxGraphemes: 3000,
            },
          },
        },
        description: 'A rogaining event.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  WinTomoXRogainingGetCheckpoints: {
    id: 'win.tomo-x.rogaining.getCheckpoints',
    defs: {
      main: {
        type: 'query',
        errors: [
          {
            name: 'EventNotFound',
          },
        ],
        output: {
          schema: {
            type: 'object',
            required: ['checkpoints'],
            properties: {
              checkpoints: {
                type: 'array',
                items: {
                  ref: 'lex:win.tomo-x.rogaining.defs#checkpointView',
                  type: 'ref',
                },
              },
            },
          },
          encoding: 'application/json',
        },
        parameters: {
          type: 'params',
          required: ['event'],
          properties: {
            event: {
              type: 'string',
              format: 'at-uri',
            },
          },
        },
        description: 'List the checkpoints of an event.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  WinTomoXRogainingGetEvent: {
    id: 'win.tomo-x.rogaining.getEvent',
    defs: {
      main: {
        type: 'query',
        errors: [
          {
            name: 'EventNotFound',
          },
        ],
        output: {
          schema: {
            type: 'object',
            required: ['event', 'teams'],
            properties: {
              event: {
                ref: 'lex:win.tomo-x.rogaining.defs#eventView',
                type: 'ref',
              },
              teams: {
                type: 'array',
                items: {
                  ref: 'lex:win.tomo-x.rogaining.defs#teamView',
                  type: 'ref',
                },
                description: 'Teams participating in the event.',
              },
            },
          },
          encoding: 'application/json',
        },
        parameters: {
          type: 'params',
          required: ['event'],
          properties: {
            event: {
              type: 'string',
              format: 'at-uri',
            },
          },
        },
        description:
          'Get the metadata of an event, including its participating teams.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  WinTomoXRogainingGetMe: {
    id: 'win.tomo-x.rogaining.getMe',
    defs: {
      main: {
        type: 'query',
        output: {
          schema: {
            type: 'object',
            required: ['participating', 'organizing'],
            properties: {
              participating: {
                type: 'array',
                items: {
                  ref: 'lex:win.tomo-x.rogaining.getMe#participation',
                  type: 'ref',
                },
                description:
                  'Events the requester participates in as a team member, with their team.',
              },
              organizing: {
                type: 'array',
                items: {
                  ref: 'lex:win.tomo-x.rogaining.defs#eventView',
                  type: 'ref',
                },
                description: 'Events authored by the requester.',
              },
            },
          },
          encoding: 'application/json',
        },
        description:
          'Get the events related to the requesting account. Requires auth. Each list is ordered by event start time, newest first.',
      },
      participation: {
        type: 'object',
        required: ['event', 'team'],
        properties: {
          event: {
            ref: 'lex:win.tomo-x.rogaining.defs#eventView',
            type: 'ref',
          },
          team: {
            ref: 'lex:win.tomo-x.rogaining.defs#teamView',
            type: 'ref',
          },
        },
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  WinTomoXRogainingGetRanking: {
    id: 'win.tomo-x.rogaining.getRanking',
    defs: {
      main: {
        type: 'query',
        errors: [
          {
            name: 'EventNotFound',
          },
        ],
        output: {
          schema: {
            type: 'object',
            required: ['ranking'],
            properties: {
              ranking: {
                type: 'array',
                items: {
                  ref: 'lex:win.tomo-x.rogaining.defs#rankingEntry',
                  type: 'ref',
                },
              },
            },
          },
          encoding: 'application/json',
        },
        parameters: {
          type: 'params',
          required: ['event'],
          properties: {
            event: {
              type: 'string',
              format: 'at-uri',
            },
          },
        },
        description:
          'Get the leaderboard of an event. Total points are the sum of approved non-goal checkpoint points (each checkpoint counts once per team) and a finish-time bonus of 30, 20, 10, 5, 3, 2, or 1 points for the first through seventh finish positions. Goal finish time is the server indexedAt timestamp; tied finishers share points. Teams without a goal submission receive no finish-time bonus.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  WinTomoXRogainingGetTeam: {
    id: 'win.tomo-x.rogaining.getTeam',
    defs: {
      main: {
        type: 'query',
        errors: [
          {
            name: 'TeamNotFound',
          },
        ],
        output: {
          schema: {
            type: 'object',
            required: ['team'],
            properties: {
              team: {
                ref: 'lex:win.tomo-x.rogaining.defs#teamView',
                type: 'ref',
              },
            },
          },
          encoding: 'application/json',
        },
        parameters: {
          type: 'params',
          required: ['team'],
          properties: {
            team: {
              type: 'string',
              format: 'at-uri',
            },
          },
        },
        description: 'Get a team and its members.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  WinTomoXRogainingListEvents: {
    id: 'win.tomo-x.rogaining.listEvents',
    defs: {
      main: {
        type: 'query',
        output: {
          schema: {
            type: 'object',
            required: ['events'],
            properties: {
              events: {
                type: 'array',
                items: {
                  ref: 'lex:win.tomo-x.rogaining.defs#eventView',
                  type: 'ref',
                },
              },
            },
          },
          encoding: 'application/json',
        },
        parameters: {
          type: 'params',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by event period relative to now.',
              knownValues: ['upcoming', 'ongoing', 'ended'],
            },
            approver: {
              type: 'string',
              format: 'did',
              description: 'Only events approved by this DID.',
            },
          },
        },
        description: 'List rogaining events, newest first.',
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  WinTomoXRogainingListSubmissions: {
    id: 'win.tomo-x.rogaining.listSubmissions',
    defs: {
      main: {
        type: 'query',
        errors: [
          {
            name: 'EventNotFound',
          },
        ],
        output: {
          schema: {
            type: 'object',
            required: ['submissions'],
            properties: {
              cursor: {
                type: 'string',
              },
              submissions: {
                type: 'array',
                items: {
                  ref: 'lex:win.tomo-x.rogaining.defs#submissionView',
                  type: 'ref',
                },
              },
            },
          },
          encoding: 'application/json',
        },
        parameters: {
          type: 'params',
          required: ['event'],
          properties: {
            event: {
              type: 'string',
              format: 'at-uri',
            },
            checkpoint: {
              type: 'string',
              format: 'at-uri',
            },
            participant: {
              type: 'string',
              format: 'did',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 50,
            },
            cursor: {
              type: 'string',
            },
          },
        },
        description:
          "List submissions for an event, newest first. The event's author and approver see every team's submissions; a participant sees only their own team's. Anyone else gets an empty list.",
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  WinTomoXRogainingReject: {
    id: 'win.tomo-x.rogaining.reject',
    defs: {
      main: {
        key: 'tid',
        type: 'record',
        record: {
          type: 'object',
          required: ['submit', 'createdAt'],
          properties: {
            submit: {
              ref: 'lex:com.atproto.repo.strongRef',
              type: 'ref',
              description: 'The submission being rejected.',
            },
            reason: {
              type: 'string',
              maxLength: 3000,
              maxGraphemes: 300,
              description:
                'Why the submission was rejected, shown to the team.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'When the submission was rejected.',
            },
          },
        },
        description:
          "An event approver's rejection of a participant's checkpoint submission. Only valid when created by the DID in the event's approver field or by the event's author. See submissionView.status for how approve and reject records are resolved.",
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  WinTomoXRogainingSubmit: {
    id: 'win.tomo-x.rogaining.submit',
    defs: {
      main: {
        key: 'tid',
        type: 'record',
        record: {
          type: 'object',
          required: ['event', 'checkpoint', 'createdAt', 'photo', 'location'],
          properties: {
            event: {
              ref: 'lex:com.atproto.repo.strongRef',
              type: 'ref',
              description: 'The event being participated in.',
            },
            photo: {
              type: 'blob',
              accept: ['image/png', 'image/jpeg', 'image/webp'],
              maxSize: 2000000,
              description: 'Photo as proof of arrival.',
            },
            location: {
              ref: 'lex:win.tomo-x.rogaining.defs#location',
              type: 'ref',
              description: 'Where the participant was when submitting.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'When the checkpoint was reached.',
            },
            checkpoint: {
              ref: 'lex:com.atproto.repo.strongRef',
              type: 'ref',
              description: 'The checkpoint that was reached.',
            },
          },
        },
        description:
          "A participant's proof of reaching a checkpoint. Ignored unless the author is a member of a team in the event. Results are shared within the team.",
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
  WinTomoXRogainingTeam: {
    id: 'win.tomo-x.rogaining.team',
    defs: {
      main: {
        key: 'tid',
        type: 'record',
        record: {
          type: 'object',
          required: ['event', 'name', 'members', 'createdAt'],
          properties: {
            name: {
              type: 'string',
              maxLength: 1000,
              maxGraphemes: 100,
            },
            event: {
              ref: 'lex:com.atproto.repo.strongRef',
              type: 'ref',
              description: 'The event this team participates in.',
            },
            members: {
              type: 'array',
              items: {
                type: 'string',
                format: 'did',
              },
              maxLength: 100,
              minLength: 1,
              description: 'DIDs of the team members.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
        description:
          "A team participating in a rogaining event. Created by the event organizer (the event's author), not by the participants themselves. Only valid when created by the DID that authored the referenced event. If a DID is a member of several teams in the same event, only the earliest created team (by createdAt) counts.",
      },
    },
    $type: 'com.atproto.lexicon.schema',
    lexicon: 1,
  },
} as const satisfies Record<string, LexiconDoc>
export const schemas: LexiconDoc[] = Object.values(schemaDict)
export const lexicons: Lexicons = new Lexicons(schemas)

export function validate<T extends { $type: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType: true,
): ValidationResult<T>
export function validate<T extends { $type?: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: false,
): ValidationResult<T>
export function validate(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: boolean,
): ValidationResult {
  return (requiredType ? is$typed : maybe$typed)(v, id, hash)
    ? lexicons.validate(`${id}#${hash}`, v)
    : {
        success: false,
        error: new ValidationError(
          `Must be an object with "${hash === 'main' ? id : `${id}#${hash}`}" $type property`,
        ),
      }
}

export const ids = {
  AppBskyActorDefs: 'app.bsky.actor.defs',
  AppBskyEmbedDefs: 'app.bsky.embed.defs',
  AppBskyEmbedExternal: 'app.bsky.embed.external',
  AppBskyEmbedGallery: 'app.bsky.embed.gallery',
  AppBskyEmbedImages: 'app.bsky.embed.images',
  AppBskyEmbedRecord: 'app.bsky.embed.record',
  AppBskyEmbedRecordWithMedia: 'app.bsky.embed.recordWithMedia',
  AppBskyEmbedVideo: 'app.bsky.embed.video',
  AppBskyFeedDefs: 'app.bsky.feed.defs',
  AppBskyFeedPostgate: 'app.bsky.feed.postgate',
  AppBskyFeedThreadgate: 'app.bsky.feed.threadgate',
  AppBskyGraphDefs: 'app.bsky.graph.defs',
  AppBskyLabelerDefs: 'app.bsky.labeler.defs',
  AppBskyNotificationDefs: 'app.bsky.notification.defs',
  AppBskyRichtextFacet: 'app.bsky.richtext.facet',
  ComAtprotoLabelDefs: 'com.atproto.label.defs',
  ComAtprotoModerationDefs: 'com.atproto.moderation.defs',
  ComAtprotoRepoStrongRef: 'com.atproto.repo.strongRef',
  WinTomoXRogainingApprove: 'win.tomo-x.rogaining.approve',
  WinTomoXRogainingCheckpoint: 'win.tomo-x.rogaining.checkpoint',
  WinTomoXRogainingDefs: 'win.tomo-x.rogaining.defs',
  WinTomoXRogainingEvent: 'win.tomo-x.rogaining.event',
  WinTomoXRogainingGetCheckpoints: 'win.tomo-x.rogaining.getCheckpoints',
  WinTomoXRogainingGetEvent: 'win.tomo-x.rogaining.getEvent',
  WinTomoXRogainingGetMe: 'win.tomo-x.rogaining.getMe',
  WinTomoXRogainingGetRanking: 'win.tomo-x.rogaining.getRanking',
  WinTomoXRogainingGetTeam: 'win.tomo-x.rogaining.getTeam',
  WinTomoXRogainingListEvents: 'win.tomo-x.rogaining.listEvents',
  WinTomoXRogainingListSubmissions: 'win.tomo-x.rogaining.listSubmissions',
  WinTomoXRogainingReject: 'win.tomo-x.rogaining.reject',
  WinTomoXRogainingSubmit: 'win.tomo-x.rogaining.submit',
  WinTomoXRogainingTeam: 'win.tomo-x.rogaining.team',
} as const
