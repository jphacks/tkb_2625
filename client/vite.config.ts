import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import  tailwindcss  from '@tailwindcss/vite'
import { CLIENT_METADATA_PATH, clientMetadata, PRODUCTION_ORIGIN } from './src/auth/clientMetadata.ts'

// 本番の client_id が指す client metadata をビルド時に書き出す (scope などをコードと揃えるため)
const oauthClientMetadata = (): Plugin => ({
  name: 'oauth-client-metadata',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: CLIENT_METADATA_PATH.slice(1), source: JSON.stringify(clientMetadata(PRODUCTION_ORIGIN), null, 2) })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),oauthClientMetadata()],
  // OAuth の loopback client は redirect_uri に IP を要求するので localhost ではなく 127.0.0.1 で開く
  server: { host: '127.0.0.1' },
})
