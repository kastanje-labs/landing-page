import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PILOT_CASHBACK_PERCENT } from "../shared";

// One illustrated month. The grid, total and cashback all use these amounts.
const days = [
  0, 4, 8, 10, 13, 17, 12, 0, 6, 9, 11, 15, 18, 21, 9, 0, 5, 7, 13, 16, 24, 8,
  4, 0, 11, 14, 20, 15, 8, 2,
];
const dayDuration = 620;
const monthDuration = days.length * dayDuration;
const money = new Intl.NumberFormat("da-DK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function LandingActivity({
  running,
  reduced,
}: {
  running: boolean;
  reduced: boolean;
}) {
  const elapsed = useRef(12 * dayDuration);
  const [time, setTime] = useState(elapsed.current);
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    let painted = last;
    const tick = (now: number) => {
      elapsed.current += Math.min(now - last, 100);
      last = now;
      if (now - painted >= 50) {
        setTime(elapsed.current);
        painted = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const progress = reduced
    ? days.length
    : Math.min(days.length, (time % (monthDuration + 4800)) / dayDuration);
  const currentDay = Math.floor(progress);
  const amounts = days.map((amount, index) =>
    Math.round(amount * 100 * Math.max(0, Math.min(1, progress - index))),
  );
  const cents = amounts.reduce((sum, amount) => sum + amount, 0);
  const cashback = Math.round((cents * PILOT_CASHBACK_PERCENT) / 100);
  const activeDays = amounts.filter((amount) => amount > 0).length;

  return (
    <div
      className="lp-activity"
      data-cents={cents}
      data-cashback-cents={cashback}
    >
      <div className="lp-activity-total">
        <span>Betalt forbrug</span>
        <strong>
          {money.format(cents / 100)}
          <small> kr.</small>
        </strong>
      </div>
      <div
        className="lp-activity-grid"
        role="img"
        aria-label={`Forbrug i 30 dage. ${activeDays} aktive dage. Mørkere felter viser højere forbrug.`}
      >
        {amounts.map((amount, index) => (
          <span
            key={index}
            className="lp-activity-day"
            data-active={index === currentDay && !reduced}
            data-amount={amount}
            style={
              {
                "--day-fill": `${amount === 0 ? 0 : 22 + (amount / 2400) * 78}%`,
              } as CSSProperties
            }
            title={`Dag ${index + 1} · ${money.format(amount / 100)} kr.`}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className="lp-activity-legend">
        <span>1 felt = 1 dag</span>
        <span>Mørkere = mere forbrug</span>
      </div>
      <dl className="lp-activity-stats">
        <div className="lp-activity-bonus">
          <dd>
            +{money.format(cashback / 100)}
            <small> kr.</small>
          </dd>
          <dt>Cashback · {PILOT_CASHBACK_PERCENT} %</dt>
        </div>
        <div>
          <dd>
            {money.format(cents / 100 / days.length)}
            <small> kr.</small>
          </dd>
          <dt>I snit pr. dag</dt>
        </div>
        <div>
          <dd>
            {activeDays}
            <small> / 30</small>
          </dd>
          <dt>Aktive dage</dt>
        </div>
      </dl>
    </div>
  );
}
