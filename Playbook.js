import { useState } from 'react'
import EconomicCalendar from './EconomicCalendar'
import NewsFeed from './NewsFeed'

export default function NewsTab() {
  const [tab, setTab] = useState('calendar')

  return (
    <div>
      {/* Sub-tab switcher */}
      <div style={{ display: 'flex', gap: '4px', padding: '16px 24px 0', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: '52px', zIndex: 30 }}>
        {[
          { id: 'calendar', label: '🔴 Economic Calendar' },
          { id: 'news',     label: '📰 Market News'       },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 16px', borderRadius: 'var(--r-xs) var(--r-xs) 0 0', fontSize: '13px', fontWeight: tab === t.id ? '700' : '600', color: tab === t.id ? 'var(--blue)' : 'var(--muted)', background: tab === t.id ? 'var(--blue-bg)' : 'transparent', border: 'none', borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', marginBottom: '-1px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'calendar' && <EconomicCalendar />}
      {tab === 'news'     && <NewsFeed />}
    </div>
  )
}
