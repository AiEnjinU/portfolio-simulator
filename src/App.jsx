import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const PRESETS = {
  VYM: { name: 'VYM', fullName: '米国高配当ETF', growth: 6, dividend: 3, currency: 'USD', accent: '#6366F1', category: '米国ETF' },
  SCHD: { name: 'SCHD', fullName: '米国増配ETF', growth: 8, dividend: 3.5, currency: 'USD', accent: '#10B981', category: '米国ETF' },
  VIG: { name: 'VIG', fullName: '米国連続増配ETF', growth: 9, dividend: 1.8, currency: 'USD', accent: '#0EA5E9', category: '米国ETF' },
  VOO: { name: 'VOO', fullName: 'S&P500連動', growth: 10, dividend: 1.2, currency: 'USD', accent: '#F59E0B', category: '米国ETF' },
  VTI: { name: 'VTI', fullName: '米国全株式', growth: 10, dividend: 1.3, currency: 'USD', accent: '#EAB308', category: '米国ETF' },
  VT: { name: 'VT', fullName: '全世界株式', growth: 8, dividend: 1.8, currency: 'USD', accent: '#06B6D4', category: '米国ETF' },
  QQQ: { name: 'QQQ', fullName: 'NASDAQ100', growth: 14, dividend: 0.5, currency: 'USD', accent: '#EC4899', category: '米国ETF' },
  JEPI: { name: 'JEPI', fullName: 'JP高配当カバコ', growth: 2, dividend: 8, currency: 'USD', accent: '#DC2626', category: '米国ETF' },
  JEPQ: { name: 'JEPQ', fullName: 'JPナスダック高配', growth: 3, dividend: 10, currency: 'USD', accent: '#B91C1C', category: '米国ETF' },
  SPYD: { name: 'SPYD', fullName: 'S&P500高配当ETF', growth: 5, dividend: 4.3, currency: 'USD', accent: '#F472B6', category: '米国ETF' },
  HDV: { name: 'HDV', fullName: '米国高配当ETF(iShares)', growth: 4, dividend: 3.8, currency: 'USD', accent: '#A78BFA', category: '米国ETF' },
  AGG: { name: 'AGG', fullName: '米国総合債券', growth: 0.5, dividend: 3.5, currency: 'USD', accent: '#64748B', category: '債券・REIT' },
  VNQ: { name: 'VNQ', fullName: '米国REIT', growth: 4, dividend: 4, currency: 'USD', accent: '#84CC16', category: '債券・REIT' },
  TLT: { name: 'TLT', fullName: '米国超長期国債', growth: -1, dividend: 4, currency: 'USD', accent: '#94A3B8', category: '債券・REIT' },
  AAPL: { name: 'AAPL', fullName: 'Apple', growth: 22, dividend: 0.5, currency: 'USD', accent: '#A1A1AA', category: '米国個別株' },
  MSFT: { name: 'MSFT', fullName: 'Microsoft', growth: 24, dividend: 0.8, currency: 'USD', accent: '#3B82F6', category: '米国個別株' },
  NVDA: { name: 'NVDA', fullName: 'NVIDIA', growth: 40, dividend: 0.03, currency: 'USD', accent: '#22C55E', category: '米国個別株' },
  TSLA: { name: 'TSLA', fullName: 'Tesla', growth: 30, dividend: 0, currency: 'USD', accent: '#EF4444', category: '米国個別株' },
  KO: { name: 'KO', fullName: 'コカ・コーラ', growth: 5, dividend: 3, currency: 'USD', accent: '#DC2626', category: '米国個別株' },
  SP500: { name: 'S&P500', fullName: 'eMAXIS Slim S&P500', growth: 10, dividend: 0, currency: 'JPY', accent: '#F97316', category: '日本投信' },
  ALLCOUNTRY: { name: 'オルカン', fullName: '全世界株式 (eMAXIS Slim)', growth: 8, dividend: 0, currency: 'JPY', accent: '#14B8A6', category: '日本投信' },
  NASDAQ: { name: 'NASDAQ100', fullName: 'NASDAQ100連動', growth: 14, dividend: 0, currency: 'JPY', accent: '#D946EF', category: '日本投信' },
  DOW: { name: 'ダウ平均', fullName: 'NYダウ連動', growth: 9, dividend: 0, currency: 'JPY', accent: '#8B5CF6', category: '日本投信' },
  TOPIX: { name: 'TOPIX', fullName: '東証株価指数', growth: 7, dividend: 0, currency: 'JPY', accent: '#BE123C', category: '日本投信' },
  N225: { name: '日経225', fullName: '日経平均連動', growth: 8, dividend: 0, currency: 'JPY', accent: '#E11D48', category: '日本投信' },
  IFREELEV: { name: 'iFレバNAS', fullName: 'iFreeレバNASDAQ100(2倍)', growth: 20, dividend: 0, currency: 'JPY', accent: '#7C3AED', category: '日本投信' },
};

const DEFAULT_HOLDINGS = [
  { id: 1, ticker: 'SP500', name: 'S&P500', fullName: 'eMAXIS Slim S&P500', amount: 1000000, monthly: 0, growth: 10, dividend: 0, currency: 'JPY', accent: '#F97316' },
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

function Card({ children, style }) {
  return (
    <div style={Object.assign({
      padding: '16px',
      background: '#f4f4f2',
      borderRadius: '12px',
    }, style || {})}>{children}</div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>{children}</div>;
}

function Value({ children }) {
  return <span style={{ fontSize: '14px', fontWeight: 500, minWidth: '44px', textAlign: 'right' }}>{children}</span>;
}

function SliderRow({ children }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{children}</div>;
}

function TabButton({ active, onClick, children }) {
  return (
    <button 
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px',
        background: active ? '#fff' : 'transparent',
        color: '#0a0a0a',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        transition: 'background 0.15s',
        boxShadow: active ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
      }}
    >{children}</button>
  );
}

function EditRow({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>{label}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px dashed rgba(0,0,0,0.08)' }}>
      <span>{label}</span>
      <span style={{ fontWeight: 500, color: color || '#0a0a0a' }}>{value}</span>
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

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.holdings && data.holdings.length > 0) {
            const migrated = data.holdings.map(h => Object.assign({ monthly: 0 }, h));
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
          holdings, years, inflation, usdJpy, futureUsdJpy, reinvest, showInflationAdjusted, displayCurrency, mode, withdrawMonthly,
        }));
      }
    } catch (e) { /* ignore */ }
  }, [loaded, holdings, years, inflation, usdJpy, futureUsdJpy, reinvest, showInflationAdjusted, displayCurrency, mode, withdrawMonthly]);

  const addHolding = (key) => {
    const preset = PRESETS[key];
    setHoldings([...holdings, {
      id: Date.now(),
      ticker: preset.name,
      name: preset.name,
      fullName: preset.fullName,
      amount: preset.currency === 'USD' ? 10000 : 1000000,
      monthly: 0,
      growth: preset.growth,
      dividend: preset.dividend,
      currency: preset.currency,
      accent: preset.accent,
    }]);
    setShowAddModal(false);
  };

  const addCustom = () => {
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#06B6D4', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6'];
    const id = Date.now();
    setHoldings([...holdings, {
      id, ticker: 'CUSTOM', name: 'カスタム', fullName: '自由入力', amount: 1000000, monthly: 0,
      growth: 7, dividend: 0, currency: 'JPY', accent: colors[holdings.length % colors.length],
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
    return initialTotal + totalMonthly * 12 * years;
  }, [initialTotal, totalMonthly, years]);

  const simulation = useMemo(() => {
    const data = [];

    if (mode === 'grow') {
      for (let y = 0; y <= years; y++) {
        const row = { year: y };
        let totalJPY = 0;
        let totalJPYReal = 0;

        holdings.forEach(h => {
          const annualRate = (h.growth + (reinvest ? h.dividend : 0)) / 100;
          const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
          const months = y * 12;
          const principalGrowth = h.amount * Math.pow(1 + annualRate, y);
          const monthly = h.monthly || 0;
          const contributionFV = (monthlyRate > 0 && months > 0)
            ? monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
            : monthly * months;
          const futureValue = principalGrowth + contributionFV;

          const rateAtYear = usdJpy + ((futureUsdJpy - usdJpy) * y / Math.max(years, 1));
          const valueInJPY = h.currency === 'USD' ? futureValue * rateAtYear : futureValue;
          const valueInUSD = h.currency === 'USD' ? futureValue : futureValue / rateAtYear;
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
      const totalInitialJPY = holdings.reduce((sum, h) => {
        const jpy = h.currency === 'USD' ? h.amount * usdJpy : h.amount;
        return sum + jpy;
      }, 0);
      const weightedRate = totalInitialJPY > 0 ? holdings.reduce((sum, h) => {
        const jpy = h.currency === 'USD' ? h.amount * usdJpy : h.amount;
        const rate = (h.growth + (reinvest ? h.dividend : 0)) / 100;
        return sum + (jpy / totalInitialJPY) * rate;
      }, 0) : 0;

      let currentValue = initialTotal;
      const annualWithdraw = withdrawMonthly * 12;

      for (let y = 0; y <= years; y++) {
        const row = { year: y };
        const inflationFactor = Math.pow(1 + inflation / 100, y);
        row.total = Math.max(0, Math.round(showInflationAdjusted ? currentValue / inflationFactor : currentValue));
        row.depleted = currentValue <= 0;
        data.push(row);

        if (y < years) {
          const afterWithdraw = Math.max(0, currentValue - annualWithdraw);
          currentValue = afterWithdraw * (1 + weightedRate);
        }
      }
    }
    return data;
  }, [holdings, years, inflation, usdJpy, futureUsdJpy, reinvest, showInflationAdjusted, displayCurrency, mode, withdrawMonthly, initialTotal]);

  const depletionYear = useMemo(() => {
    if (mode !== 'withdraw') return null;
    const found = simulation.find(d => d.total <= 0);
    return found ? found.year : null;
  }, [simulation, mode]);

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
      const contributions = initialInDisplay + monthlyInDisplay * 12 * years;
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
          {mode === 'grow' ? years + '年後の予想資産' : (depletionYear ? depletionYear + '年で枯渇' : years + '年後の残高')}
        </div>
        <div style={{ fontSize: 'clamp(28px, 8vw, 40px)', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          {formatMoney(summary.final)}
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
                元本 {formatMoney(summary.initial, true)} + 月{formatMoney(totalMonthly, true)}積立 × {years * 12}ヶ月 = 投入額 {formatMoney(totalContributions, true)}
              </div>
            )}
          </div>
        )}

        {mode === 'withdraw' && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
            現在 {formatMoney(summary.initial, true)} から<br />
            月{formatMoney(withdrawMonthly, true)}(年{formatMoney(withdrawMonthly * 12, true)})を取り崩し
          </div>
        )}

        {simulation.length > 0 && (
          <div style={{ height: '140px', marginTop: '20px', marginLeft: '-8px', marginRight: '-8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulation}>
                <defs>
                  <linearGradient id="mainGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="total" stroke={accentColor} strokeWidth={2} fill="url(#mainGradient)" />
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
          <Label>シミュレーション年数</Label>
          <SliderRow>
            <input type="range" min="1" max="40" step="1" value={years} onChange={e => setYears(+e.target.value)} style={{ flex: 1 }} />
            <Value>{years}年</Value>
          </SliderRow>
        </Card>

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
                <Value>{inflation.toFixed(1)}%</Value>
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
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{h.name}</div>
                    <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.fullName} · {h.growth}%
                      {h.dividend > 0 ? ' + 配' + h.dividend + '%' : ''}
                      {(h.monthly || 0) > 0 ? ' · 月' + formatMoney(monthlyDisplay, true) + '積立' : ''}
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
                      {(h.monthly || 0) > 0 && (
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                          年間: {h.currency === 'USD' ? '$' : '¥'}{((h.monthly || 0) * 12).toLocaleString()}
                        </div>
                      )}
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
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#666' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => formatMoney(v, true).replace(/[¥$]/, '')}
                  width={50}
                />
                <Tooltip 
                  formatter={(v) => formatMoney(v)}
                  labelFormatter={(l) => l + '年後'}
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
            <Stat label="年間取り崩し額" value={formatMoney(withdrawMonthly * 12)} />
            <Stat label={depletionYear ? '資産が枯渇する年' : (years + '年後の残高')} 
              value={depletionYear ? (depletionYear + '年目') : formatMoney(summary.final)} 
              color={depletionYear ? '#EF4444' : '#10B981'} 
            />
            {!depletionYear && initialTotal > 0 && (
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
        ※ 過去平均ベースの試算であり、将来の運用成果を保証するものではありません。税金は考慮していません。取り崩しモードでは、ポートフォリオ全体の加重平均リターンで運用しつつ年初に引き出す前提で計算しています。
      </div>
    </div>
  );
}