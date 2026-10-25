// vite.config.ts からも import するので、ブラウザ専用のモジュールには (型以外) 依存させない
import type { OAuthClientMetadataInput } from '@atproto/oauth-client-browser';

/** 本番の origin。client_id (= client metadata の URL) はここから決まる */
export const PRODUCTION_ORIGIN = 'https://rogaining.tomo-x.win';

/** appview のサービス DID (public/.well-known/did.json と appview/src/index.ts に合わせる) */
export const APPVIEW_SERVICE = 'did:web:rogaining.tomo-x.win#rogaining_api';

export const CALLBACK_PATH = '/oauth/callback';
export const CLIENT_METADATA_PATH = '/oauth-client-metadata.json';

const COLLECTIONS = ['event', 'checkpoint', 'team', 'submit', 'approve', 'reject'].map(name => `win.tomo-x.rogaining.${name}`);

export const OAUTH_SCOPE = [
  'atproto',
  `repo?${COLLECTIONS.map(nsid => `collection=${nsid}`).join('&')}`,
  `rpc?lxm=*&aud=${APPVIEW_SERVICE.replace('#', '%23')}`,
  'blob:image/*',
].join(' ');

export function clientMetadata(origin: string): OAuthClientMetadataInput {
  return {
    client_id: `${origin}${CLIENT_METADATA_PATH}`,
    client_name: 'AtRogaining',
    client_uri: origin,
    redirect_uris: [`${origin}${CALLBACK_PATH}`],
    scope: OAUTH_SCOPE,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    application_type: 'web',
    token_endpoint_auth_method: 'none',
    dpop_bound_access_tokens: true,
  };
}
