import { useState, useEffect } from 'react';
import { FiClock } from 'react-icons/fi';

function useCountdown(endDate) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endDate) return;
    const end = new Date(endDate).getTime();

    const calc = () => {
      const diff = end - Date.now();
      if (diff <= 0) return setTimeLeft({ expired: true, d: 0, h: 0, m: 0, s: 0 });
      setTimeLeft({
        expired: false,
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };

    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return timeLeft;
}

const pad = n => String(n).padStart(2, '0');

/* Compact version for ProductCard */
export function SaleCountdownCompact({ endDate }) {
  const time = useCountdown(endDate);
  if (!time) return null;
  if (time.expired) return (
    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium px-2 py-1 bg-gray-50 rounded-b-xl border-t">
      <FiClock size={10} />
      Đã kết thúc
    </div>
  );
  return (
    <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-1.5 rounded-b-xl border-t border-rose-100">
      <FiClock size={10} className="shrink-0" />
      <span>Còn:</span>
      {time.d > 0 && <span>{time.d}ng</span>}
      <span className="tabular-nums">{pad(time.h)}:{pad(time.m)}:{pad(time.s)}</span>
    </div>
  );
}

/* Inline pill version for ProductDetail — placed next to the discount badge */
export function SaleCountdownInline({ endDate }) {
  const time = useCountdown(endDate);
  if (!time) return null;

  if (time.expired) return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full">
      <FiClock size={11} />
      Đã kết thúc
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
      <FiClock size={11} className="shrink-0" />
      <span>Còn:</span>
      {time.d > 0 && <span>{time.d}ng</span>}
      <span className="tabular-nums">{pad(time.h)}:{pad(time.m)}:{pad(time.s)}</span>
    </span>
  );
}
