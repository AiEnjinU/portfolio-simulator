import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const PRESETS = {
  VOO: { name: 'VOO', fullName: 'S&P500連動', growth: 10, dividend: 1.2, currency: 'USD', accent: '#F59E0B', category: '米国ETF', fxLinked: true },
  VTI: { name: 'VTI', fullName: '米国全株式', growth: 10, dividend: 1.3, currency: 'USD', accent: '#EAB308', category: '米国ETF', fxLinked: true },
  VT: { name: 'VT', fullName: '全世界株式', growth: 8, dividend: 1.8, currency: 'USD', accent: '#06B6D4', category: '米国ETF', fxLinked: true },
  QQQ: { name: 'QQQ', fullName: 'NASDAQ100', growth: 14, dividend: 0.5, currency: 'USD', accent: '#EC4899', category: '米国ETF', fxLinked: true },
  VYM: { name: 'VYM', fullName: '米国高配当ETF', growth: 6, dividend: 3, currency: 'USD', accent: '#6366F1', category: '米国ETF', fxLinked: true },
  HDV: { name: 'HDV', fullName: '米国高配当ETF(iShares)', growth: 4, dividend: 3.8, currency: 'USD', accent: '#A78BFA', category: '米国ETF', fxLinked: true },
  SPYD: { name: 'SPYD', fullName: 'S&P500高配当ETF', growth: 5, dividend: 4.3, currency: 'USD', accent: '#F472B6', category: '米国ETF', fxLinked: true },
  SCHD: { name: 'SCHD', fullName: '米国増配ETF', growth: 8, dividend: 3.5, currency: 'USD', accent: '#10B981', category: '米国ETF', fxLinked: true },
  VIG: { name: 'VIG', fullName: '米国連続増配ETF', growth: 9, dividend: 1.8, currency: 'USD', accent: '#0EA5E9', category: '米国ETF', fxLinked: true },
  JEPQ: { name: 'JEPQ', fullName: 'JPナスダック高配', growth: 3, dividend: 10, currency: 'USD', accent: '#B91C1C', category: '米国ETF', fxLinked: true },
  JEPI: { name: 'JEPI', fullName: 'JP高配当カバコ', growth: 2, dividend: 8, currency: 'USD', accent: '#DC2626', category: '米国ETF', fxLinked: true },
  AGG: { name: 'AGG', fullName: '米国総合債券', growth: 0.5, dividend: 3.5, currency: 'USD', accent: '#64748B', category: '債券・REIT', fxLinked: true },
  VNQ: { name: 'VNQ', fullName: '米国REIT', growth: 4, dividend: 4, currency: 'USD', accent: '#84CC16', category: '債券・REIT', fxLinked: true },
  TLT: { name: 'TLT', fullName: '米国超長期国債', growth: -1, dividend: 4, currency: 'USD', accent: '#94A3B8', category: '債券・REIT', fxLinked: true },
  AAPL: { name: 'AAPL', fullName: 'Apple', growth: 22, dividend: 0.5, currency: 'USD', accent: '#A1A1AA', category: '米国個別株', fxLinked: true },
  MSFT: { name: 'MSFT', fullName: 'Microsoft', growth: 24, dividend: 0.8, currency: 'USD', accent: '#3B82F6', category: '米国個別株', fxLinked: true },
  NVDA: { name: 'NVDA', fullName: 'NVIDIA', growth: 40, dividend: 0.03, currency: 'USD', accent: '#22C55E', category: '米国個別株', fxLinked: true },
  TSLA: { name: 'TSLA', fullName: 'Tesla', growth: 30, dividend: 0, currency: 'USD', accent: '#EF4444', category: '米国個別株', fxLinked: true },
  KO: { name: 'KO', fullName: 'コカ・コーラ', growth: 5, dividend: 3, currency: 'USD', accent: '#DC2626', category: '米国個別株', fxLinked: true },
  SP500: { name: 'S&P500', fullName: 'eMAXIS Slim S&P500', growth: 10, dividend: 0, currency: 'JPY', accent: '#F97316', category: '日本投信', fxLinked: true },
  ALLCOUNTRY: { name: 'オルカン', fullName: '全世界株式 (eMAXIS Slim)', growth: 8, dividend: 0, currency: 'JPY', accent: '#14B8A6', category: '日本投信', fxLinked: true },
  NASDAQ: { name: 'NASDAQ100', fullName: 'NASDAQ100連動', growth: 14, dividend: 0, currency: 'JPY', accent: '#D946EF', category: '日本投信', fxLinked: true },
  DOW: { name: 'ダウ平均', fullName: 'NYダウ連動', growth: 9, dividend: 0, currency: 'JPY', accent: '#8B5CF6', category: '日本投信', fxLinked: true },
  TOPIX: { name: 'TOPIX', fullName: '東証株価指数', growth: 7, dividend: 0, currency: 'JPY', accent: '#BE123C', category: '日本投信', fxLinked: false },
  N225: { name: '日経225', fullName: '日経平均連動', growth: 8, dividend: 0, currency: 'JPY', accent: '#E11D48', category: '日本投信', fxLinked: false },
  IFREELEV: { name: 'iFレバNAS', fullName: 'iFreeレバNASDAQ100(2倍)', growth: 20, dividend: 0, currency: 'JPY', accent: '#7C3AED', category: '日本投信', fxLinked: true },
};

const DEFAULT_HOLDINGS = [
  { id: 1, ticker: 'SP500', name: 'S&P500', fullName: 'eMAXIS Slim S&P500', amount: 1000000, monthly: 0, monthlyYears: 0, growth: 10, dividend: 0, currency: 'JPY', accent: '#F97316', tax: 20, fxLinked: true },
];

const STORAGE_KEY = 'portfolio_state_v2';

const webInputStyle = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '14px',
  border: '0.5px solid rgba(0,0,0,0.15)',
  borderRadius: '8px',
  background: '#fff',
  color: '#0a0a0a',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

function Card(props) {
  const merged = Object.assign({
    padding: '16px',
    background: '#f4f4f2',
    borderRadius: '12px',
  }, props.style || {});
  return <div style={merged}>{props.children}</div>;
}

function Label(props) {
  return <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>{props.children}</div>;
}

function ValueText(props) {
  return <span style={{ fontSize: '14px', fontWeight: 500, minWidth: '44px', textAlign: 'right' }}>{props.children}</span>;
}

function SliderRow(props) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{props.children}</div>;
}

function TabButton(props) {
  return (
    <button
      onClick={props.onClick}
      style={{
        flex: 1,
        padding: '10px',
        background: props.active ? '#fff' : 'transparent',
        color: '#0a0a0a',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: props.active ? 500 : 400,
        cursor: 'pointer',
        transition: 'background 0.15s',
        boxShadow: props.active ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
      }}
    >{props.children}</button>
  );
}

function EditRow(props) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>{props.label}</div>
      {props.children}
    </div>
  );
}

function Stat(props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px dashed rgba(0,0,0,0.08)' }}>
      <span>{props.label}</span>
      <span style={{ fontWeight: 500, color: props.color || '#0a0a0a' }}>{props.value}</span>
    </div>
  );
}

export default function App() {
  const [holdings, setHoldings] = useState(DEFAULT_HOLDINGS);
  const [years, setYears] = useState(20);
  const [inflation, setInflation] = useState(2);
  const [usdJpy, setUsdJpy] = useState(150);
  const [futureUsdJpy, setFutureUsdJpy] = useState(150);
  const [reinvest, setReinvest] = useState(true);
  const [showInflationAdjusted, setShowInflationAdjusted] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState('JPY');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showSettings, setShowSettings] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState('grow');
  const [withdrawMonthly, setWithdrawMonthly] = useState(200000);
  const [withdrawStartYear, setWithdrawStartYear] = useState(20);
  const [currentAge, setCurrentAge] = useState(35);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.holdings && data.holdings.length > 0) {
            const migrated = data.holdings.map(h => {
              const defaults = { monthly: 0, monthlyYears: 0, tax: 20 };
              if (h.fxLinked === undefined) {
                defaults.fxLinked = h.currency === 'USD';
              }
              return Object.assign({}, defaults, h);
            });
            setHoldings(migrated);
          }
          if (typeof data.years === 'number') setYears(data.years);
          if (typeof data.inflation === 'number') setInflation(data.inflation);
          if (typeof data.usdJpy === 'number') setUsdJpy(data.usdJpy);
          if (typeof data.futureUsdJpy === 'number') setFutureUsdJpy(data.futureUsdJpy);
          if (typeof data.reinvest === 'boolean') setReinvest(data.reinvest);
          if (typeof data.showInflationAdjusted === 'boolean') setShowInflationAdjusted(data.showInflationAdjusted);
          if (typeof data.displayCurrency === 'string') setDisplayCurrency(data.displayCurrency);
          if (typeof data.mode === 'string') setMode(data.mode);
          if (typeof data.withdrawMonthly === 'number') setWithdrawMonthly(data.withdrawMonthly);
          if (typeof data.withdrawStartYear === 'number') setWithdrawStartYear(data.withdrawStartYear);
          if (typeof data.currentAge === 'number') setCurrentAge(data.currentAge);
        }
      }
    } catch (e) { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          holdings, years, inflation, usdJpy, futureUsdJpy, reinvest, showInflationAdjusted, displayCurrency, mode, withdrawMonthly, withdrawStartYear, currentAge,
        }));
      }
    } catch (e) { /* ignore */ }
  }, [loaded, holdings, years, inflation, usdJpy, futureUsdJpy, reinvest, showInflationAdjusted, displayCurrency, mode, withdrawMonthly, withdrawStartYear, currentAge]);

  const addHolding = (key) => {
    const preset = PRESETS[key];
    setHoldings([...holdings, {
      id: Date.now(),
      ticker: preset.name,
      name: preset.name,
      fullName: preset.fullName,
      amount: preset.currency === 'USD' ? 10000 : 1000000,
      monthly: 0,
      monthlyYears: 0,
      growth: preset.growth,
      dividend: preset.dividend,
      currency: preset.currency,
      accent: preset.accent,
      tax: 20,
      fxLinked: preset.fxLinked,
    }]);
    setShowAddModal(false);
  };

  const addCustom = () => {
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#06B6D4', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6'];
    const id = Date.now();
    setHoldings([...holdings, {
      id, ticker: 'CUSTOM', name: 'カスタム', fullName: '自由入力', amount: 1000000, monthly: 0, monthlyYears: 0,
      growth: 7, dividend: 0, currency: 'JPY', accent: colors[holdings.length % colors.length], tax: 20, fxLinked: false,
    }]);
    setEditingId(id);
    setShowAddModal(false);
  };

  const updateHolding = (id, field, value) => {
    setHoldings(holdings.map(h => h.id === id ? Object.assign({}, h, { [field]: value }) : h));
  };
  const removeHolding = (id) => setHoldings(holdings.filter(h => h.id !== id));

  const initialTotal = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const jpy = h.currency === 'USD' ? h.amount * usdJpy : h.amount;
      return sum + (displayCurrency === 'JPY' ? jpy : jpy / usdJpy);
    }, 0);
  }, [holdings, usdJpy, displayCurrency]);

  const totalMonthly = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const m = h.monthly || 0;
      const jpy = h.currency === 'USD' ? m * usdJpy : m;
      return sum + (displayCurrency === 'JPY' ? jpy : jpy / usdJpy);
    }, 0);
  }, [holdings, usdJpy, displayCurrency]);

  const totalContributions = useMemo(() => {
    let total = initialTotal;
    holdings.forEach(h => {
      const m = h.monthly || 0;
      if (m === 0) return;
      const contribYears = (h.monthlyYears && h.monthlyYears > 0)
        ? Math.min(h.monthlyYears, years)
        : years;
      const monthlyJPY = h.currency === 'USD' ? m * usdJpy : m;
      const monthlyInDisplay = displayCurrency === 'JPY'
        ? monthlyJPY
        : monthlyJPY / usdJpy;
      total += monthlyInDisplay * 12 * contribYears;
    });
    return total;
  }, [holdings, initialTotal, years, usdJpy, displayCurrency]);

  const simulation = useMemo(() => {
    const data = [];

    if (mode === 'grow') {
      for (let y = 0; y <= years; y++) {
        const row = { year: y };
        let totalJPY = 0;
        let totalJPYReal = 0;

        holdings.forEach(h => {
          const tax = (h.tax || 0) / 100;
          const effectiveDividend = reinvest ? h.dividend * (1 - tax) : 0;
          const annualRate = (h.growth + effectiveDividend) / 100;
          const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

          const monthly = h.monthly || 0;
          const contribMaxYears = (h.monthlyYears && h.monthlyYears > 0) ? h.monthlyYears : years;
          const activeContribYears = Math.min(y, contribMaxYears);
          const activeContribMonths = activeContribYears * 12;

          const principalGrowth = h.amount * Math.pow(1 + annualRate, y);

          let contributionFV;
          if (activeContribMonths === 0 || monthly === 0) {
            contributionFV = 0;
          } else if (monthlyRate > 0) {
            const fvAtEndOfContrib = monthly * ((Math.pow(1 + monthlyRate, activeContribMonths) - 1) / monthlyRate);
            const idleYears = y - activeContribYears;
            contributionFV = fvAtEndOfContrib * Math.pow(1 + annualRate, idleYears);
          } else {
            contributionFV = monthly * activeContribMonths;
          }

          const futureValueBeforeTax = principalGrowth + contributionFV;
          const totalInvestedLocal = h.amount + monthly * activeContribMonths;
          const capitalGain = Math.max(0, futureValueBeforeTax - totalInvestedLocal);
          const capitalGainTax = capitalGain * tax;
          const futureValue = futureValueBeforeTax - capitalGainTax;

          const rateAtYear = usdJpy + ((futureUsdJpy - usdJpy) * y / Math.max(years, 1));
          let valueInJPY, valueInUSD;
          if (h.currency === 'USD') {
            valueInJPY = futureValue * rateAtYear;
            valueInUSD = futureValue;
          } else if (h.fxLinked) {
            const futureValueInUSD = futureValue / usdJpy;
            valueInJPY = futureValueInUSD * rateAtYear;
            valueInUSD = futureValueInUSD;
          } else {
            valueInJPY = futureValue;
            valueInUSD = futureValue / rateAtYear;
          }

          const inflationFactor = Math.pow(1 + inflation / 100, y);
          const displayValue = displayCurrency === 'JPY'
            ? (showInflationAdjusted ? valueInJPY / inflationFactor : valueInJPY)
            : (showInflationAdjusted ? valueInUSD / inflationFactor : valueInUSD);
          row['h' + h.id] = Math.round(displayValue);
          totalJPY += valueInJPY;
          totalJPYReal += valueInJPY / inflationFactor;
        });

        const rateAtYear = usdJpy + ((futureUsdJpy - usdJpy) * y / Math.max(years, 1));
        const totalUSD = totalJPY / rateAtYear;
        const totalUSDReal = totalJPYReal / rateAtYear;
        row.total = Math.round(
          displayCurrency === 'JPY'
            ? (showInflationAdjusted ? totalJPYReal : totalJPY)
            : (showInflationAdjusted ? totalUSDReal : totalUSD)
        );
        data.push(row);
      }
    } else {
      const holdingState = holdings.map(h => {
        const tax = (h.tax || 0) / 100;
        const effectiveDividend = reinvest ? h.dividend * (1 - tax) : 0;
        const annualRate = (h.growth + effectiveDividend) / 100;
        let nativeValue;
        if (h.currency === 'USD') {
          nativeValue = h.amount;
        } else if (h.fxLinked) {
          nativeValue = h.amount / usdJpy;
        } else {
          nativeValue = h.amount;
        }
        return {
          h, annualRate, nativeValue,
          monthly: h.monthly || 0,
        };
      });

      const getTotalInDisplay = (y) => {
        const rateAtYear = usdJpy + ((futureUsdJpy - usdJpy) * y / Math.max(years, 1));
        let totalJPY = 0;
        holdingState.forEach(s => {
          const h = s.h;
          let valueInJPY;
          if (h.currency === 'USD' || h.fxLinked) {
            valueInJPY = s.nativeValue * rateAtYear;
          } else {
            valueInJPY = s.nativeValue;
          }
          totalJPY += valueInJPY;
        });
        return displayCurrency === 'JPY' ? totalJPY : totalJPY / rateAtYear;
      };

      const withdrawProportionally = (annualWithdrawInDisplay, yearForRate) => {
        const rateAtYear = usdJpy + ((futureUsdJpy - usdJpy) * yearForRate / Math.max(years, 1));
        const withdrawJPY = displayCurrency === 'JPY' ? annualWithdrawInDisplay : annualWithdrawInDisplay * rateAtYear;
        const values = holdingState.map(s => {
          const h = s.h;
          if (h.currency === 'USD' || h.fxLinked) {
            return s.nativeValue * rateAtYear;
          } else {
            return s.nativeValue;
          }
        });
        const totalJPY = values.reduce((a, b) => a + b, 0);
        if (totalJPY <= 0) return;

        holdingState.forEach((s, i) => {
          const share = values[i] / totalJPY;
          const withdrawFromThisJPY = withdrawJPY * share;
          const h = s.h;
          let withdrawFromThisNative;
          if (h.currency === 'USD' || h.fxLinked) {
            withdrawFromThisNative = withdrawFromThisJPY / rateAtYear;
          } else {
            withdrawFromThisNative = withdrawFromThisJPY;
          }
          s.nativeValue = Math.max(0, s.nativeValue - withdrawFromThisNative);
        });
      };

      const applyMonthlyContributions = (currentY) => {
        holdingState.forEach(s => {
          const h = s.h;
          const contribMaxYears = (h.monthlyYears && h.monthlyYears > 0) ? h.monthlyYears : years;
          if (currentY >= contribMaxYears) return;

          if (s.monthly > 0) {
            if (h.currency === 'USD') {
              s.nativeValue += s.monthly * 12;
            } else if (h.fxLinked) {
              s.nativeValue += (s.monthly * 12) / usdJpy;
            } else {
              s.nativeValue += s.monthly * 12;
            }
          }
        });
      };

      const applyGrowth = () => {
        holdingState.forEach(s => {
          s.nativeValue *= (1 + s.annualRate);
        });
      };

      for (let y = 0; y <= years; y++) {
        const row = { year: y };
        const totalInDisplay = getTotalInDisplay(y);
        const inflationFactor = Math.pow(1 + inflation / 100, y);
        row.total = Math.max(0, Math.round(showInflationAdjusted ? totalInDisplay / inflationFactor : totalInDisplay));
        row.depleted = totalInDisplay <= 0;
        row.phase = y < withdrawStartYear ? 'accumulating' : 'withdrawing';
        data.push(row);

        if (y < years) {
          if (y < withdrawStartYear) {
            applyMonthlyContributions(y);
            applyGrowth();
          } else {
            withdrawProportionally(withdrawMonthly * 12, y);
            applyGrowth();
          }
        }
      }
    }
    return data;
  }, [holdings, years, inflation, usdJpy, futureUsdJpy, reinvest, showInflationAdjusted, displayCurrency, mode, withdrawMonthly, withdrawStartYear, initialTotal]);

  const depletionYear = useMemo(() => {
    if (mode !== 'withdraw') return null;
    const found = simulation.find(d => d.year >= withdrawStartYear && d.total <= 0);
    return found ? found.year : null;
  }, [simulation, mode, withdrawStartYear]);

  const summary = useMemo(() => {
    const final = simulation.length > 0 ? simulation[simulation.length - 1].total : 0;
    const baseForGain = mode === 'grow' ? totalContributions : initialTotal;
    const gain = final - baseForGain;
    const gainPct = baseForGain > 0 ? (gain / baseForGain) * 100 : 0;
    return { initial: Math.round(initialTotal), final: Math.round(final), gain: Math.round(gain), gainPct };
  }, [simulation, initialTotal, totalContributions, mode]);

  const perHoldingFinal = useMemo(() => {
    if (simulation.length === 0 || mode !== 'grow') return [];
    const last = simulation[simulation.length - 1];
    return holdings.map(h => {
      const finalValue = last['h' + h.id] || 0;
      const initialInDisplay = displayCurrency === 'JPY'
        ? (h.currency === 'USD' ? h.amount * usdJpy : h.amount)
        : (h.currency === 'USD' ? h.amount : h.amount / usdJpy);
      const monthly = h.monthly || 0;
      const monthlyInDisplay = displayCurrency === 'JPY'
        ? (h.currency === 'USD' ? monthly * usdJpy : monthly)
        : (h.currency === 'USD' ? monthly : monthly / usdJpy);
      const contribYears = (h.monthlyYears && h.monthlyYears > 0)
        ? Math.min(h.monthlyYears, years)
        : years;
      const contributions = initialInDisplay + monthlyInDisplay * 12 * contribYears;
      const gain = finalValue - contributions;
      const gainPct = contributions > 0 ? (gain / contributions) * 100 : 0;
      return Object.assign({}, h, {
        finalValue,
        initialInDisplay: Math.round(initialInDisplay),
        contributions: Math.round(contributions),
        gain: Math.round(gain),
        gainPct,
      });
    });
  }, [simulation, holdings, usdJpy, displayCurrency, mode, years]);

  const formatMoney = (v, short) => {
    const symbol = displayCurrency === 'JPY' ? '¥' : '$';
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (short) {
      if (displayCurrency === 'JPY') {
        if (abs >= 100000000) return sign + symbol + (abs / 100000000).toFixed(2) + '億';
        if (abs >= 10000) return sign + symbol + Math.round(abs / 10000).toLocaleString() + '万';
      } else {
        if (abs >= 1000000) return sign + symbol + (abs / 1000000).toFixed(2) + 'M';
        if (abs >= 1000) return sign + symbol + (abs / 1000).toFixed(1) + 'K';
      }
    }
    return sign + symbol + Math.round(abs).toLocaleString();
  };

  const isPositive = mode === 'grow' ? summary.gain >= 0 : !depletionYear;
  const accentColor = isPositive ? '#10B981' : '#EF4444';

  const monthlyDisplayFor = (h) => {
    const m = h.monthly || 0;
    return displayCurrency === 'JPY'
      ? (h.currency === 'USD' ? m * usdJpy : m)
      : (h.currency === 'USD' ? m : m / usdJpy);
  };

  const ageTicks = useMemo(() => {
    const arr = [];
    const startAge = currentAge;
    const endAge = currentAge + years;
    const firstTick = Math.ceil(startAge / 5) * 5;
    for (let age = firstTick; age <= endAge; age += 5) {
      arr.push(age - currentAge);
    }
    if (arr.length === 0 || arr[0] > 1) arr.unshift(0);
    if (arr[arr.length - 1] < years - 1) arr.push(years);
    return arr;
  }, [currentAge, years]);

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif',
      maxWidth: '880px',
      margin: '0 auto',
      padding: 'clamp(16px, 4vw, 32px) clamp(16px, 4vw, 24px)',
      background: '#fff',
      color: '#0a0a0a',
      lineHeight: 1.6,
      minHeight: '100vh',
    }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: '#888', letterSpacing: '1px', marginBottom: '4px' }}>PORTFOLIO SIMULATOR</div>
        <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 500, margin: 0 }}>ポートフォリオ シミュレーター</h1>
      </div>

      <div style={{
        display: 'flex',
        gap: '4px',
        background: '#f4f4f2',
        padding: '4px',
        borderRadius: '10px',
        marginBottom: '20px',
      }}>
        <TabButton active={mode === 'grow'} onClick={() => setMode('grow')}>積立・運用</TabButton>
        <TabButton active={mode === 'withdraw'} onClick={() => setMode('withdraw')}>取り崩し</TabButton>
      </div>

      <div style={{
        padding: 'clamp(18px, 4vw, 28px)',
        background: '#f4f4f2',
        borderRadius: '14px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
          {mode === 'grow'
            ? (currentAge + years) + '歳時点の予想資産 (' + years + '年後)'
            : (depletionYear !== null
                ? (currentAge + depletionYear) + '歳で枯渇 (' + depletionYear + '年後)'
                : (currentAge + years) + '歳時点の残高 (' + years + '年後)')}
        </div>
        <div style={{ fontSize: 'clamp(28px, 8vw, 40px)', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          {formatMoney(summary.final)}
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
          現在{currentAge}歳 → {currentAge + years}歳
        </div>

        {mode === 'grow' && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px',
              fontSize: '14px',
              color: accentColor,
              fontWeight: 500,
              flexWrap: 'wrap',
            }}>
              <span>{summary.gain >= 0 ? '▲' : '▼'}</span>
              <span>{formatMoney(Math.abs(summary.gain), true)}</span>
              <span>({summary.gain >= 0 ? '+' : ''}{summary.gainPct.toFixed(1)}%)</span>
              <span style={{ color: '#888', fontWeight: 400 }}>vs 投入額 {formatMoney(totalContributions, true)}</span>
            </div>
            {totalMonthly > 0 && (
              <div style={{
                marginTop: '10px',
                fontSize: '12px',
                color: '#666',
                paddingTop: '10px',
                borderTop: '0.5px dashed rgba(0,0,0,0.1)',
              }}>
                元本 {formatMoney(summary.initial, true)} + 積立総額 {formatMoney(totalContributions - summary.initial, true)} = 投入額 {formatMoney(totalContributions, true)}
              </div>
            )}
          </div>
        )}

        {mode === 'withdraw' && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
            {withdrawStartYear > 0
              ? currentAge + '歳(現在' + formatMoney(summary.initial, true) + ')→ ' + (currentAge + withdrawStartYear) + '歳まで積立 → ' + (currentAge + withdrawStartYear) + '歳から月' + formatMoney(withdrawMonthly, true) + '取り崩し'
              : currentAge + '歳・' + formatMoney(summary.initial, true) + ' から月' + formatMoney(withdrawMonthly, true) + '(年' + formatMoney(withdrawMonthly * 12, true) + ')を取り崩し'}
          </div>
        )}

        {simulation.length > 0 && (
          <div style={{ height: '160px', marginTop: '20px', marginLeft: '-8px', marginRight: '-8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulation} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="mainGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                  ticks={ageTicks}
                  tickFormatter={(v) => (currentAge + v) + '歳'}
                  interval={0}
                />
                <Tooltip
                  formatter={(v) => formatMoney(v)}
                  labelFormatter={(l) => (currentAge + l) + '歳 (' + l + '年後)'}
                  contentStyle={{
                    background: '#fff',
                    border: '0.5px solid rgba(0,0,0,0.15)',
                    borderRadius: '8px', fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="total" stroke={accentColor} strokeWidth={2} fill="url(#mainGradient)" />
                {mode === 'withdraw' && withdrawStartYear > 0 && withdrawStartYear < years && (
                  <ReferenceLine x={withdrawStartYear} stroke="#F59E0B" strokeDasharray="2 2" />
                )}
                {mode === 'withdraw' && depletionYear && (
                  <ReferenceLine x={depletionYear} stroke="#EF4444" strokeDasharray="3 3" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <Card>
          <Label>今の年齢</Label>
          <SliderRow>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={currentAge}
              onChange={e => setCurrentAge(+e.target.value)}
              style={{ flex: 1 }}
            />
            <ValueText>{currentAge}歳</ValueText>
          </SliderRow>
        </Card>

        {mode === 'grow' && (
          <Card>
            <Label>何歳までシミュレーション</Label>
            <SliderRow>
              <input
                type="range"
                min={currentAge + 1}
                max="110"
                step="1"
                value={currentAge + years}
                onChange={e => setYears(+e.target.value - currentAge)}
                style={{ flex: 1 }}
              />
              <ValueText>{currentAge + years}歳</ValueText>
            </SliderRow>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
              期間: {years}年
            </div>
          </Card>
        )}

        {mode === 'withdraw' && (
          <Card>
            <Label>何歳から取り崩す</Label>
            <SliderRow>
              <input
                type="range"
                min={currentAge}
                max={currentAge + years}
                step="1"
                value={currentAge + Math.min(withdrawStartYear, years)}
                onChange={e => setWithdrawStartYear(+e.target.value - currentAge)}
                style={{ flex: 1 }}
              />
              <ValueText>{currentAge + withdrawStartYear}歳</ValueText>
            </SliderRow>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
              {withdrawStartYear === 0
                ? '今すぐ取り崩し開始'
                : 'あと' + withdrawStartYear + '年間は積立・運用'}
            </div>
          </Card>
        )}

        {mode === 'withdraw' && (
          <Card>
            <Label>何歳までシミュレーション</Label>
            <SliderRow>
              <input
                type="range"
                min={currentAge + 1}
                max="110"
                step="1"
                value={currentAge + years}
                onChange={e => setYears(+e.target.value - currentAge)}
                style={{ flex: 1 }}
              />
              <ValueText>{currentAge + years}歳</ValueText>
            </SliderRow>
          </Card>
        )}

        {mode === 'withdraw' && (
          <Card>
            <Label>月の取り崩し額 ({displayCurrency === 'JPY' ? '円' : 'ドル'})</Label>
            <input
              type="number"
              value={withdrawMonthly}
              step={displayCurrency === 'JPY' ? 10000 : 100}
              onChange={e => setWithdrawMonthly(+e.target.value || 0)}
              style={webInputStyle}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
              年額: {formatMoney(withdrawMonthly * 12, true)}
            </div>
          </Card>
        )}
      </div>

      <Card style={{ marginBottom: '20px' }}>
        <div
          onClick={() => setShowSettings(!showSettings)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
        >
          <span style={{ fontSize: '14px', fontWeight: 500 }}>詳細設定</span>
          <span style={{ fontSize: '14px', color: '#888', transform: showSettings ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▸</span>
        </div>
        {showSettings && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '0.5px solid rgba(0,0,0,0.1)',
          }}>
            <div>
              <Label>インフレ率</Label>
              <SliderRow>
                <input type="range" min="0" max="10" step="0.1" value={inflation} onChange={e => setInflation(+e.target.value)} style={{ flex: 1 }} />
                <ValueText>{inflation.toFixed(1)}%</ValueText>
              </SliderRow>
            </div>
            <div>
              <Label>現在のドル円</Label>
              <input type="number" value={usdJpy} step="0.1" onChange={e => setUsdJpy(+e.target.value || 0)} style={webInputStyle} />
            </div>
            <div>
              <Label>{years}年後のドル円</Label>
              <input type="number" value={futureUsdJpy} step="0.1" onChange={e => setFutureUsdJpy(+e.target.value || 0)} style={webInputStyle} />
            </div>
            <div>
              <Label>表示通貨</Label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['JPY', 'USD'].map(c => (
                  <button key={c} onClick={() => setDisplayCurrency(c)} style={{
                    flex: 1, padding: '8px',
                    background: displayCurrency === c ? '#0a0a0a' : 'transparent',
                    color: displayCurrency === c ? '#fff' : '#0a0a0a',
                    border: '0.5px solid rgba(0,0,0,0.2)',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  }}>{c === 'JPY' ? '円' : 'ドル'}</button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={reinvest} onChange={e => setReinvest(e.target.checked)} />
                配当再投資
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={showInflationAdjusted} onChange={e => setShowInflationAdjusted(e.target.checked)} />
                インフレ調整後で表示
              </label>
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, margin: 0 }}>保有銘柄</h2>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: '#0a0a0a',
            color: '#fff',
            border: 'none', borderRadius: '8px',
            padding: '8px 14px', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer',
          }}
        >+ 銘柄を追加</button>
      </div>

      {holdings.length === 0 ? (
        <div style={{
          padding: '40px 20px', textAlign: 'center',
          color: '#888', fontSize: '14px',
          background: '#f4f4f2',
          borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.15)',
        }}>
          銘柄を追加してください
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {holdings.map((h) => {
            const perf = perHoldingFinal.find(p => p.id === h.id);
            const monthlyDisplay = monthlyDisplayFor(h);
            const hasMonthly = Number(h.monthly) > 0;
            const monthlyYearsNum = Number(h.monthlyYears) || 0;
            return (
              <div key={h.id} style={{
                background: '#fff',
                border: '0.5px solid rgba(0,0,0,0.1)',
                borderRadius: '10px',
                overflow: 'hidden',
              }}>
                <div
                  onClick={() => setEditingId(editingId === h.id ? null : h.id)}
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: h.accent, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, flexShrink: 0,
                  }}>{h.name.slice(0, 4)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {h.name}
                      {(h.tax || 0) === 0 && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          background: '#10B981',
                          color: '#fff',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}>NISA</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.fullName} · {h.growth}%
                      {h.dividend > 0 ? ' + 配' + h.dividend + '%' : ''}
                      {hasMonthly ? (' · 月' + formatMoney(monthlyDisplay, true) + (monthlyYearsNum > 0 ? '積立(' + monthlyYearsNum + '年)' : '積立')) : ''}
                    </div>
                  </div>
                  {mode === 'grow' && perf && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{formatMoney(perf.finalValue, true)}</div>
                      <div style={{ fontSize: '11px', color: perf.gainPct >= 0 ? '#10B981' : '#EF4444', fontWeight: 500 }}>
                        {perf.gainPct >= 0 ? '+' : ''}{perf.gainPct.toFixed(1)}%
                      </div>
                    </div>
                  )}
                  {mode === 'withdraw' && (
                    <div style={{ textAlign: 'right', flexShrink: 0, fontSize: '13px', color: '#666' }}>
                      {formatMoney(displayCurrency === 'JPY'
                        ? (h.currency === 'USD' ? h.amount * usdJpy : h.amount)
                        : (h.currency === 'USD' ? h.amount : h.amount / usdJpy), true)}
                    </div>
                  )}
                </div>

                {editingId === h.id && (
                  <div style={{
                    padding: '12px 16px 16px',
                    borderTop: '0.5px solid rgba(0,0,0,0.08)',
                    background: '#f9f9f7',
                    display: 'grid', gap: '10px',
                  }}>
                    <EditRow label="銘柄名">
                      <input type="text" value={h.name} onChange={e => updateHolding(h.id, 'name', e.target.value)} style={webInputStyle} />
                    </EditRow>
                    <EditRow label={'評価額 (' + h.currency + ')'}>
                      <input type="number" value={h.amount} onChange={e => updateHolding(h.id, 'amount', +e.target.value || 0)} style={webInputStyle} />
                    </EditRow>
                    <EditRow label={'月の積立額 (' + h.currency + ')'}>
                      <input
                        type="number"
                        value={h.monthly || 0}
                        step={h.currency === 'USD' ? 100 : 10000}
                        onChange={e => updateHolding(h.id, 'monthly', +e.target.value || 0)}
                        style={webInputStyle}
                      />
                      {hasMonthly && (
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                          年間: {(h.currency === 'USD' ? '$' : '¥') + ((h.monthly || 0) * 12).toLocaleString()}
                        </div>
                      )}
                    </EditRow>
                    <EditRow label="積立期間">
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="number"
                          value={h.monthlyYears || 0}
                          step="1"
                          min="0"
                          max="60"
                          onChange={e => updateHolding(h.id, 'monthlyYears', +e.target.value || 0)}
                          style={Object.assign({}, webInputStyle, { flex: 1 })}
                          disabled={!hasMonthly}
                        />
                        <span style={{ fontSize: '13px', color: '#666' }}>年</span>
                        <button
                          onClick={() => updateHolding(h.id, 'monthlyYears', 0)}
                          disabled={!hasMonthly}
                          style={{
                            padding: '8px 12px',
                            background: monthlyYearsNum === 0 ? '#0a0a0a' : 'transparent',
                            color: monthlyYearsNum === 0 ? '#fff' : '#0a0a0a',
                            border: '0.5px solid rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: hasMonthly ? 'pointer' : 'not-allowed',
                            opacity: hasMonthly ? 1 : 0.4,
                            whiteSpace: 'nowrap',
                          }}
                        >期間全体</button>
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                        {!hasMonthly
                          ? '月の積立額を設定すると有効になります'
                          : monthlyYearsNum === 0
                            ? 'シミュレーション期間中ずっと積み立てる'
                            : monthlyYearsNum + '年間積み立てて、その後は運用のみ(' + (currentAge + monthlyYearsNum) + '歳まで積立)'}
                      </div>
                    </EditRow>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <EditRow label="通貨">
                        <select value={h.currency} onChange={e => updateHolding(h.id, 'currency', e.target.value)} style={webInputStyle}>
                          <option value="JPY">円</option>
                          <option value="USD">$</option>
                        </select>
                      </EditRow>
                      <EditRow label="成長%/年">
                        <input type="number" value={h.growth} step="0.1" onChange={e => updateHolding(h.id, 'growth', +e.target.value || 0)} style={webInputStyle} />
                      </EditRow>
                      <EditRow label="配当%/年">
                        <input type="number" value={h.dividend} step="0.1" onChange={e => updateHolding(h.id, 'dividend', +e.target.value || 0)} style={webInputStyle} />
                      </EditRow>
                    </div>
                    <EditRow label="税率 (%)">
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="number"
                          value={h.tax || 0}
                          step="1"
                          min="0"
                          max="100"
                          onChange={e => updateHolding(h.id, 'tax', +e.target.value || 0)}
                          style={Object.assign({}, webInputStyle, { flex: 1 })}
                        />
                        <button
                          onClick={() => updateHolding(h.id, 'tax', 0)}
                          style={{
                            padding: '8px 12px',
                            background: (h.tax || 0) === 0 ? '#10B981' : 'transparent',
                            color: (h.tax || 0) === 0 ? '#fff' : '#10B981',
                            border: '0.5px solid #10B981',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >NISA</button>
                        <button
                          onClick={() => updateHolding(h.id, 'tax', 20)}
                          style={{
                            padding: '8px 12px',
                            background: (h.tax || 0) === 20 ? '#0a0a0a' : 'transparent',
                            color: (h.tax || 0) === 20 ? '#fff' : '#0a0a0a',
                            border: '0.5px solid rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >課税20%</button>
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                        配当は毎年、売却益は{years}年後に課税されます
                      </div>
                    </EditRow>
                    <EditRow label="為替(ドル円)の影響">
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        background: '#fff',
                        border: '0.5px solid rgba(0,0,0,0.15)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}>
                        <input
                          type="checkbox"
                          checked={h.fxLinked || false}
                          onChange={e => updateHolding(h.id, 'fxLinked', e.target.checked)}
                        />
                        <span>この銘柄は為替(ドル円)の影響を受ける</span>
                      </label>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                        {h.fxLinked
                          ? '米国株や米国株投信は通常ON。円高になると円建て評価額が下がります'
                          : '日経225・TOPIX等の純国内資産はOFF。日本円のみで完結'}
                      </div>
                    </EditRow>
                    <button
                      onClick={() => { removeHolding(h.id); setEditingId(null); }}
                      style={{
                        background: 'transparent', color: '#EF4444',
                        border: '0.5px solid rgba(239,68,68,0.3)',
                        borderRadius: '8px', padding: '8px',
                        fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginTop: '4px',
                      }}
                    >この銘柄を削除</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {mode === 'grow' && holdings.length > 1 && simulation.length > 0 && (
        <Card style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 500, margin: '0 0 12px' }}>銘柄別推移</h3>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simulation} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(128,128,128,0.15)" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (currentAge + v) + '歳'}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#666' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => formatMoney(v, true).replace(/[¥$]/, '')}
                  width={50}
                />
                <Tooltip
                  formatter={(v) => formatMoney(v)}
                  labelFormatter={(l) => (currentAge + l) + '歳 (' + l + '年後)'}
                  contentStyle={{
                    background: '#fff',
                    border: '0.5px solid rgba(0,0,0,0.15)',
                    borderRadius: '8px', fontSize: '12px',
                  }}
                />
                {holdings.map((h) => (
                  <Line key={h.id} type="monotone" dataKey={'h' + h.id} name={h.name} stroke={h.accent} strokeWidth={1.8} dot={false} />
                ))}
                <Line type="monotone" dataKey="total" name="合計" stroke="#0a0a0a" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px', fontSize: '12px', color: '#666' }}>
            {holdings.map(h => (
              <span key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '2px', background: h.accent, borderRadius: '1px' }} />
                {h.name}
              </span>
            ))}
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
              <span style={{ width: '10px', height: '2px', background: '#0a0a0a', borderRadius: '1px' }} />
              合計
            </span>
          </div>
        </Card>
      )}

      {mode === 'withdraw' && holdings.length > 0 && (
        <Card style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 500, margin: '0 0 12px' }}>取り崩しシミュレーション</h3>
          <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.8 }}>
            {withdrawStartYear > 0 && simulation[withdrawStartYear] && (
              <Stat
                label={(currentAge + withdrawStartYear) + '歳(取り崩し開始)の資産'}
                value={formatMoney(simulation[withdrawStartYear].total)}
                color="#F59E0B"
              />
            )}
            <Stat label="年間取り崩し額" value={formatMoney(withdrawMonthly * 12)} />
            <Stat label={depletionYear !== null ? '資産が枯渇する年齢' : (currentAge + years) + '歳時点の残高'}
              value={depletionYear !== null ? (currentAge + depletionYear) + '歳 (' + depletionYear + '年後)' : formatMoney(summary.final)}
              color={depletionYear !== null ? '#EF4444' : '#10B981'}
            />
            {depletionYear === null && withdrawStartYear > 0 && simulation[withdrawStartYear] && simulation[withdrawStartYear].total > 0 && (
              <Stat
                label="取り崩し開始時の年間率"
                value={((withdrawMonthly * 12 / simulation[withdrawStartYear].total) * 100).toFixed(1) + '%'}
              />
            )}
            {depletionYear === null && withdrawStartYear === 0 && initialTotal > 0 && (
              <Stat label="年間取り崩しの元本比率(現在)"
                value={((withdrawMonthly * 12 / initialTotal) * 100).toFixed(1) + '%'}
              />
            )}
          </div>
          <div style={{
            marginTop: '14px', padding: '12px',
            background: '#e6f1fb',
            borderRadius: '8px',
            fontSize: '12px', color: '#0C447C',
            lineHeight: 1.6,
          }}>
            💡 一般的に「年4%ルール」(年間取り崩し率を資産の4%以内)を守ると、30年以上持つと言われています。
          </div>
        </Card>
      )}

      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              width: '100%', maxWidth: '500px', maxHeight: '85vh',
              borderRadius: '14px', padding: '20px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '17px', fontWeight: 500 }}>銘柄を追加</div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}
              >×</button>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              {['日本投信', '米国ETF', '米国個別株', '債券・REIT'].map(cat => (
                <div key={cat}>
                  <div style={{
                    fontSize: '11px', color: '#888',
                    letterSpacing: '0.5px', marginBottom: '6px', fontWeight: 500,
                  }}>{cat}</div>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {Object.entries(PRESETS).filter(([, p]) => p.category === cat).map(([key, p]) => (
                      <button
                        key={key}
                        onClick={() => addHolding(key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 12px',
                          background: '#f4f4f2',
                          border: '0.5px solid rgba(0,0,0,0.08)',
                          borderRadius: '10px',
                          color: '#0a0a0a',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: p.accent, color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 700, flexShrink: 0,
                        }}>{p.name.slice(0, 4)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.fullName} · 年{p.growth}%{p.dividend > 0 ? ' + 配' + p.dividend + '%' : ''}
                          </div>
                        </div>
                        <div style={{ fontSize: '18px', color: '#aaa' }}>+</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={addCustom}
                style={{
                  padding: '12px', background: 'transparent',
                  border: '1px dashed rgba(0,0,0,0.2)',
                  borderRadius: '10px',
                  color: '#666',
                  cursor: 'pointer', fontSize: '13px',
                }}
              >+ カスタム銘柄を追加</button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        fontSize: '11px', color: '#888',
        lineHeight: 1.6, marginTop: '24px',
        paddingTop: '16px', borderTop: '0.5px solid rgba(0,0,0,0.08)',
      }}>
        ※ 過去平均ベースの試算であり、将来の運用成果を保証するものではありません。税金は銘柄ごとの税率設定(デフォルト20%、NISAなら0%)に基づき、配当は毎年税引き後再投資、売却益は最終年に課税する前提で計算しています。「為替連動」をONにした銘柄は、原資産をドル建てとみなしてドル円変動を反映します。積立期間は銘柄ごとに指定可能で、期間終了後は運用のみ継続します。取り崩しモードでは、ポートフォリオ全体の加重平均リターンで運用しつつ年初に引き出す前提で計算しています。
      </div>
    </div>
  );
}