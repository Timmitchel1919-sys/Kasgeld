import { ArrowRight, Clock3, Info, LockKeyhole, UserRound, Users } from 'lucide-react'
import type { Activity } from '../types'

const icons = { person: UserRound, lock: LockKeyhole, users: Users, info: Info }

export function ActivityPanel({ activities }: { activities: Activity[] }) {
  return (
    <section className="panel activity-panel">
      <div className="panel-title"><span className="title-icon blue"><Clock3 size={25} /></span><h2>Recente activiteit</h2><button className="link-button">Bekijk alles <ArrowRight size={16} /></button></div>
      <div className="activity-list">{activities.map(item => { const Icon = icons[item.icon]; return <article className={item.tone === 'success' ? 'activity success' : 'activity'} key={item.id}>
        <span className={`activity-icon ${item.icon}`}><Icon /></span><div><strong>{item.title}</strong><p>{item.detail}</p></div><time>{item.time}</time>
      </article> })}</div>
    </section>
  )
}
