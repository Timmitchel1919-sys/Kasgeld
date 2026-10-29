import { Info, LockKeyhole, RotateCw, Trophy } from 'lucide-react'
import { months } from '../data'

type WheelProps = {
  rotation: number
  spinning: boolean
  selectedMonth: string
  selectedName: string
  onSpin: () => void
}

export function MonthWheel({ rotation, spinning, selectedMonth, selectedName, onSpin }: WheelProps) {
  return (
    <section className="panel wheel-panel">
      <div className="panel-title wheel-title">
        <span className="title-icon amber"><Trophy size={24} /></span>
        <h2>Draai aan het maandrad</h2>
        <span className="rule-chip"><Info size={16} /> Elke deelnemer mag<br />maar 1 keer draaien</span>
      </div>
      <div className="wheel-wrap">
        <div className="wheel-pointer" aria-hidden="true" />
        <div className={`wheel ${spinning ? 'spinning' : ''}`} style={{ transform: `rotate(${rotation}deg)` }}>
          {months.map((month, index) => {
            const angle = index * 30 + 15
            return <span className={`month-label month-${index}`} style={{ '--angle': `${angle}deg` } as React.CSSProperties} key={month}>{month === selectedMonth ? <><LockKeyhole size={14} />{month}<small>{selectedName}</small></> : month}</span>
          })}
        </div>
        <button className="spin-button" onClick={onSpin} disabled={spinning}>
          <strong>{spinning ? '...' : 'DRAAI'}</strong><RotateCw size={23} />
        </button>
      </div>
      <div className="winner-card" aria-live="polite">
        <h3>🎉 &nbsp;{selectedName} heeft gedraaid!</h3>
        <p>Hij is uitgekomen op:</p>
        <div><LockKeyhole /> <strong>{selectedMonth}</strong><span>Toegewezen aan {selectedName}</span></div>
      </div>
      <div className="info-card"><Info /><p><strong>Elke deelnemer mag maar 1 keer draaien.</strong><br />Een gekozen maand wordt direct vergrendeld en kan door andere deelnemers niet meer worden gekozen.</p></div>
    </section>
  )
}
