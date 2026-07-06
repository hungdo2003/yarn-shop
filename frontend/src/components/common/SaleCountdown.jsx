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
  const t = useCountdown(endDate);
  if (!t) return null;
  if (t.expired) return (
    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium px-2 py-1 bg-gray-50 rounded-b-xl border-t">
      <FiClock size={10} />
      Đã kết thúc
    </div>
  );
  return (
    <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-1.5 rounded-b-xl border-t border-rose-100">
      <FiClock size={10} className="shrink-0" />
      <span>Còn:</span>
      {t.d > 0 && <span>{t.d}ng</span>}
      <span className="tabular-nums">{pad(t.h)}:{pad(t.m)}:{pad(t.s)}</span>
    </div>
  );
}

/* Full version for ProductDetail */
export function SaleCountdownFull({ endDate }) {
  const t = useCountdown(endDate);
  if (!t) return null;

  if (t.expired) return (
    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
      <FiClock size={14} />
      <span>Chương trình giảm giá đã kết thúc</span>
    </div>
  );

  const blocks = [
    { value: t.d, label: 'Ngày' },
    { value: t.h, label: 'Giờ' },
    { value: t.m, label: 'Phút' },
    { value: t.s, label: 'Giây' },
  ];

  return (
    <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 rounded-xl px-4 py-3">
      <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold mb-2">
        <FiClock size={13} />
        Giảm giá kết thúc sau:
      </div>
      <div className="flex items-center gap-2">
        {blocks.map(({ value, label }, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className="text-center">
              <div className="bg-rose-500 text-white font-black text-lg leading-none rounded-lg w-11 h-11 flex items-center justify-center tabular-nums shadow-sm">
                {pad(value)}
              </div>
              <p className="text-[10px] text-gray-500 mt-1 font-medium">{label}</p>
            </div>
            {i < 3 && <span className="text-rose-400 font-black text-lg mb-3 select-none">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
