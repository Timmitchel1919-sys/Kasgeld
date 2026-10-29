import { CalendarDays, LockKeyhole } from 'lucide-react'
import { months } from '../data'

export function MonthOverview() {
  return (
    <section className="panel month-panel">
      <div className="panel-title">
        <span className="title-icon blue"><CalendarDays size={25} /></span>
        <div><h2>Maandoverzicht</h2><p>Bekijk welke maanden nog beschikbaar zijn en welke al zijn toegewezen.</p></div>
        <div className="legend"><span><i className="dot green" />Beschikbaar</span><span className="locked-legend"><LockKeyhole size={13} /> Vergrendeld (toegewezen)</span></div>
      </div>
      <div className="month-grid">
        {months.map(month => month === 'April' ? (
          <article className="month-card locked" key={month}><LockKeyhole /><div><strong>April</strong><span>Shaquil</span></div><span className="locked-owner"><b>S</b> Vergrendeld</span></article>
        ) : (
          <article className="month-card" key={month}><CalendarDays /><strong>{month}</strong><span><i className="dot green" />Beschikbaar</span></article>
        ))}
      </div>
    </section>
  )
}
