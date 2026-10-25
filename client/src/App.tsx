import { useState } from 'react'

export function App() {
  return (
    <main className="organizer-home">
      <header><strong>AtRogaining</strong><span>主催者向け管理画面</span></header>
      <section><p className="eyebrow">ORGANIZER CONSOLE</p><h1>イベント管理</h1><p>イベント情報を作成し、主催者アカウントのPDSに保存します。</p><a className="primary-link" href="/admin/events/new">イベントを作成する <span aria-hidden="true">→</span></a></section>
    </main>
  )
}
