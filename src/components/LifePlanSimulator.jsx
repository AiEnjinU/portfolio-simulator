import React, { useState, useMemo, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const STORAGE_KEY = 'lifeplan_state_v1'

const GREEN = '#10B981'
const AMBER = '#F59E0B'
const RED = '#EF4444'
const BLUE = '#3B82F6'

const DEFAULT_EXPENSES = [
  { id: 'housing', icon: '🏠', label: '住居費（家賃・ローン）', val: 8 },
  { id: 'food', icon: '🍱', label: '食費', val: 6 },
  { id: 'trans', icon: '🚃', label: '交通費', val: 1.5 },
  { id: 'util', icon: '💡', label: '光熱・通信費', val: 2.5 },
  { id: 'ins', icon: '🛡', label: '保険料', val: 1.5 },
  { id: 'misc', icon: '🎵', label: '雑費・娯楽', val: 4 },
]

function netMonthly(gross) {
  let t = 0
  if (gross <= 195) t = 0.05
  else if (gross <= 330) t = 0.10
  else if (gross <= 695) t = 0.20
  else if (gross <= 900) t = 0.23
  else if (gross <= 1800) t = 0.33
  else t = 0.40
  return gross / 12 * (1 - t - 0.15)
}

function childStage(age) {
  if (age < 0 || age > 22) return { label: '対象外', cost: 0 }
  if (age < 3) return { label: '乳幼児', cost: 3.5 }
  if (age < 7) return { label: '未就学', cost: 4.5 }
  if (age < 13) return { label: '小学生', cost: 5.5 }
  if (age < 16) return { label: '中学生', cost: 7.0 }
  if (age < 19) return { label: '高校生', cost: 7.5 }
  return { label: '大学生', cost: 9.0 }
}

function getStageAt(yearOffset, children, childAges, years) {
  if (yearOffset >= years) return 'retire'
  if (children > 0) {
    let maxAge = -1
    for (let i = 0; i < children; i++) {
      const a = (childAges[i] || 0) + yearOffset
      if (a > maxAge) maxAge = a
    }
    if (maxAge >= 0 && maxAge <= 22) return 'child'
  }
  return 'empty'
}

function monthlyExpenseAt(yearOffset, baseExpTotal, children, childAges, rateChild, rateEmpty, rateRetire, inflationOn, inflation, years) {
  const stage = getStageAt(yearOffset, children, childAges, years)
  let stageRate = 1
  if (stage === 'child') stageRate = rateChild / 100
  else if (stage === 'empty') stageRate = rateEmpty / 100
  else stageRate = rateRetire / 100

  const base = baseExpTotal * stageRate

  let childCost = 0
  if (stage !== 'retire') {
    for (let i = 0; i < children; i++) {
      const a = (childAges[i] || 0) + yearOffset
      childCost += childStage(a).cost
    }
  }

  let total = base + childCost
  if (inflationOn) {
    total = total * Math.pow(1 + inflation / 100, yearOffset)
  }
  return { total, base, childCost, stage }
}

function runYearlySimulation(args) {
  const {
    age, income, pIncome, partnerOn, savings, children, childAges,
    years, rate, manualInvest, expenses, rateChild, rateEmpty, rateRetire,
    inflationOn, inflation,
  } = args

  const baseExpTotal = expenses.reduce((s, e) => s + (Number(e.val) || 0), 0)
  const r = rate / 100
  const monthlyR = r / 12

  let asset = savings
  let totalInvested = 0
  const points = []

  points.push({
    y: 0,
    label: age + '歳',
    asset: Math.round(asset),
    invest: 0,
    expense: 0,
    stage: getStageAt(0, children, childAges, years),
    principal: Math.round(savings),
  })

  for (let y = 1; y <= years; y++) {
    const inflFactor = inflationOn ? Math.pow(1 + inflation / 100, y - 1) : 1
    const grossIncome = income * inflFactor + (partnerOn ? pIncome * inflFactor : 0)
    const incomeMonthly = netMonthly(income * inflFactor) + (partnerOn ? netMonthly(pIncome * inflFactor) : 0)

    const exp = monthlyExpenseAt(y - 1, baseExpTotal, children, childAges, rateChild, rateEmpty, rateRetire, inflationOn, inflation, years)
    const surplus = Math.max(0, incomeMonthly - exp.total)

    let monthlyInvest
    if (manualInvest > 0) {
      monthlyInvest = Math.min(manualInvest, surplus)
    } else {
      monthlyInvest = surplus * 0.25
    }

    let newAsset
    if (monthlyR > 0) {
      newAsset = asset * Math.pow(1 + monthlyR, 12) + monthlyInvest * (Math.pow(1 + monthlyR, 12) - 1) / monthlyR
    } else {
      newAsset = asset + monthlyInvest * 12
    }

    asset = newAsset
    totalInvested += monthlyInvest * 12

    points.push({
      y,
      label: (age + y) + '歳',
      asset: Math.round(asset),
      invest: Math.round(monthlyInvest),
      expense: Math.round(exp.total),
      stage: exp.stage,
      principal: Math.round(savings + totalInvested),
    })

    void grossIncome
  }

  return {
    points,
    finalAsset: asset,
    principal: savings + totalInvested,
    gain: asset - (savings + totalInvested),
    totalInvested,
  }
}

function simulateDrawdown(startAsset, monthlyWithdraw, rateAnnual) {
  const monthlyR = rateAnnual / 100 / 12
  let a = startAsset
  let cum = 0
  const pts = [{ y: 0, a: Math.round(a), cum: 0 }]
  let depletedYear = null
  for (let m = 1; m <= 100 * 12; m++) {
    a = a * (1 + monthlyR) - monthlyWithdraw
    cum += monthlyWithdraw
    if (m % 12 === 0) {
      pts.push({ y: m / 12, a: Math.max(0, Math.round(a)), cum: Math.round(cum) })
    }
    if (a <= 0 && depletedYear === null) {
      depletedYear = m / 12
      if (m % 12 !== 0) {
        pts.push({ y: m / 12, a: 0, cum: Math.round(cum) })
      }
      break
    }
  }
  return { pts, depletedYear }
}

function fmt(v) {
  if (v === null || v === undefined || isNaN(v)) return '-'
  const abs = Math.abs(v)
  if (abs >= 10000) return (v / 10000).toFixed(2) + '億'
  return Math.round(v).toLocaleString()
}

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
}

function Card(props) {
  const merged = Object.assign({
    padding: '16px',
    background: '#f4f4f2',
    borderRadius: '12px',
  }, props.style || {})
  return <div style={merged}>{props.children}</div>
}

function Label(props) {
  return <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>{props.children}</div>
}

function ValueText(props) {
  return <span style={{ fontSize: '14px', fontWeight: 500, minWidth: '52px', textAlign: 'right' }}>{props.children}</span>
}

function SliderRow(props) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{props.children}</div>
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
        fontSize: '13px',
        fontWeight: props.active ? 500 : 400,
        cursor: 'pointer',
        transition: 'background 0.15s',
        boxShadow: props.active ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
      }}
    >{props.children}</button>
  )
}

function Stat(props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px dashed rgba(0,0,0,0.08)' }}>
      <span>{props.label}</span>
      <span style={{ fontWeight: 500, color: props.color || '#0a0a0a' }}>{props.value}</span>
    </div>
  )
}

const STAGE_LABEL = { child: '子育て期', empty: '空の巣期', retire: '老後期' }
const STAGE_COLOR = { child: AMBER, empty: BLUE, retire: GREEN }

export default function LifePlanSimulator() {
  const [mode, setMode] = useState('grow')
  const [activeTab, setActiveTab] = useState('income')
  const [age, setAge] = useState(30)
  const [income, setIncome] = useState(500)
  const [savings, setSavings] = useState(100)
  const [partnerOn, setPartnerOn] = useState(false)
  const [pIncome, setPIncome] = useState(350)
  const [children, setChildren] = useState(1)
  const [childAges, setChildAges] = useState([3])
  const [years, setYears] = useState(25)
  const [rate, setRate] = useState(5)
  const [manualInvest, setManualInvest] = useState(0)
  const [rateChild, setRateChild] = useState(110)
  const [rateEmpty, setRateEmpty] = useState(85)
  const [rateRetire, setRateRetire] = useState(70)
  const [inflationOn, setInflationOn] = useState(true)
  const [inflation, setInflation] = useState(2)
  const [ddStart, setDdStart] = useState(25)
  const [ddAmount, setDdAmount] = useState(15)
  const [ddRate, setDdRate] = useState(3)
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const d = JSON.parse(raw)
          if (typeof d.mode === 'string') setMode(d.mode)
          if (typeof d.activeTab === 'string') setActiveTab(d.activeTab)
          if (typeof d.age === 'number') setAge(d.age)
          if (typeof d.income === 'number') setIncome(d.income)
          if (typeof d.savings === 'number') setSavings(d.savings)
          if (typeof d.partnerOn === 'boolean') setPartnerOn(d.partnerOn)
          if (typeof d.pIncome === 'number') setPIncome(d.pIncome)
          if (typeof d.children === 'number') setChildren(d.children)
          if (Array.isArray(d.childAges)) setChildAges(d.childAges)
          if (typeof d.years === 'number') setYears(d.years)
          if (typeof d.rate === 'number') setRate(d.rate)
          if (typeof d.manualInvest === 'number') setManualInvest(d.manualInvest)
          if (typeof d.rateChild === 'number') setRateChild(d.rateChild)
          if (typeof d.rateEmpty === 'number') setRateEmpty(d.rateEmpty)
          if (typeof d.rateRetire === 'number') setRateRetire(d.rateRetire)
          if (typeof d.inflationOn === 'boolean') setInflationOn(d.inflationOn)
          if (typeof d.inflation === 'number') setInflation(d.inflation)
          if (typeof d.ddStart === 'number') setDdStart(d.ddStart)
          if (typeof d.ddAmount === 'number') setDdAmount(d.ddAmount)
          if (typeof d.ddRate === 'number') setDdRate(d.ddRate)
          if (Array.isArray(d.expenses)) setExpenses(d.expenses)
        }
      }
    } catch (e) { /* ignore */ }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          mode, activeTab, age, income, savings, partnerOn, pIncome, children, childAges,
          years, rate, manualInvest, rateChild, rateEmpty, rateRetire, inflationOn, inflation,
          ddStart, ddAmount, ddRate, expenses,
        }))
      }
    } catch (e) { /* ignore */ }
  }, [loaded, mode, activeTab, age, income, savings, partnerOn, pIncome, children, childAges,
      years, rate, manualInvest, rateChild, rateEmpty, rateRetire, inflationOn, inflation,
      ddStart, ddAmount, ddRate, expenses])

  useEffect(() => {
    if (childAges.length === children) return
    if (childAges.length < children) {
      const add = []
      for (let i = childAges.length; i < children; i++) add.push(0)
      setChildAges([...childAges, ...add])
    } else {
      setChildAges(childAges.slice(0, children))
    }
  }, [children, childAges])

  const sim = useMemo(() => runYearlySimulation({
    age, income, pIncome, partnerOn, savings, children, childAges,
    years, rate, manualInvest, expenses, rateChild, rateEmpty, rateRetire,
    inflationOn, inflation,
  }), [age, income, pIncome, partnerOn, savings, children, childAges,
       years, rate, manualInvest, expenses, rateChild, rateEmpty, rateRetire,
       inflationOn, inflation])

  const drawdown = useMemo(() => {
    const startAsset = sim.points[Math.min(ddStart, sim.points.length - 1)]?.asset || sim.finalAsset
    return simulateDrawdown(startAsset, ddAmount, ddRate)
  }, [sim, ddStart, ddAmount, ddRate])

  const sensitivity = useMemo(() => {
    const monthlyOptions = [5, 10, 15, 20, 25, 30]
    const rateOptions = [0, 1, 2, 3, 4, 5]
    const startAsset = sim.points[Math.min(ddStart, sim.points.length - 1)]?.asset || sim.finalAsset
    const grid = monthlyOptions.map(m => {
      return {
        m,
        cells: rateOptions.map(r => {
          const res = simulateDrawdown(startAsset, m, r)
          return { r, years: res.depletedYear, depleted: res.depletedYear !== null }
        }),
      }
    })
    return { monthlyOptions, rateOptions, grid }
  }, [sim, ddStart, ddAmount, ddRate])

  const stageSummary = useMemo(() => {
    const stages = ['child', 'empty', 'retire']
    const result = {}
    sim.points.forEach((p, i) => {
      if (i === 0) return
      if (!result[p.stage]) {
        const baseExpTotal = expenses.reduce((s, e) => s + (Number(e.val) || 0), 0)
        const exp = monthlyExpenseAt(i - 1, baseExpTotal, children, childAges, rateChild, rateEmpty, rateRetire, inflationOn, inflation, years)
        const inflFactor = inflationOn ? Math.pow(1 + inflation / 100, i - 1) : 1
        const incomeMonthly = netMonthly(income * inflFactor) + (partnerOn ? netMonthly(pIncome * inflFactor) : 0)
        const surplus = Math.max(0, incomeMonthly - exp.total)
        result[p.stage] = {
          year: i,
          age: age + i,
          income: incomeMonthly,
          expense: exp.total,
          base: exp.base,
          childCost: exp.childCost,
          invest: p.invest,
          surplus,
        }
      }
    })
    return stages.filter(s => result[s]).map(s => Object.assign({ stage: s }, result[s]))
  }, [sim, expenses, children, childAges, rateChild, rateEmpty, rateRetire, inflationOn, inflation, years, age, income, partnerOn, pIncome])

  const baseExpTotal = useMemo(() => expenses.reduce((s, e) => s + (Number(e.val) || 0), 0), [expenses])
  const incomeNetMonthly = useMemo(() => netMonthly(income) + (partnerOn ? netMonthly(pIncome) : 0), [income, pIncome, partnerOn])

  const updateExpense = (id, val) => {
    setExpenses(expenses.map(e => e.id === id ? Object.assign({}, e, { val: val }) : e))
  }

  const updateChildAge = (idx, v) => {
    const next = [...childAges]
    next[idx] = v
    setChildAges(next)
  }

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
        <div style={{ fontSize: '12px', color: '#888', letterSpacing: '1px', marginBottom: '4px' }}>LIFE PLAN SIMULATOR</div>
        <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 500, margin: 0 }}>ライフプラン シミュレーター</h1>
      </div>

      <div style={{
        display: 'flex',
        gap: '4px',
        background: '#f4f4f2',
        padding: '4px',
        borderRadius: '10px',
        marginBottom: '20px',
      }}>
        <TabButton active={mode === 'grow'} onClick={() => setMode('grow')}>資産形成</TabButton>
        <TabButton active={mode === 'draw'} onClick={() => setMode('draw')}>取り崩し</TabButton>
      </div>

      {mode === 'grow' && (
        <div style={{
          padding: 'clamp(18px, 4vw, 28px)',
          background: '#f4f4f2',
          borderRadius: '14px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            {(age + years)}歳時点の予想資産（{years}年後）
          </div>
          <div style={{ fontSize: 'clamp(28px, 8vw, 40px)', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.1, color: GREEN }}>
            {fmt(sim.finalAsset)}<span style={{ fontSize: '0.5em', color: '#666', marginLeft: '4px' }}>万円</span>
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            元本 {fmt(sim.principal)}万 · 運用益 {fmt(sim.gain)}万
          </div>

          <div style={{ height: '220px', marginTop: '16px', marginLeft: '-8px', marginRight: '-8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sim.points} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="lpGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GREEN} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.max(0, Math.floor(years / 6))}
                />
                <YAxis
                  tickFormatter={v => fmt(v)}
                  tick={{ fontSize: 11, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  formatter={(v, name) => [fmt(v) + '万円', name === 'asset' ? '総資産' : '投資元本']}
                  contentStyle={{
                    background: '#fff',
                    border: '0.5px solid rgba(0,0,0,0.15)',
                    borderRadius: '8px', fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="asset" stroke={GREEN} fill="url(#lpGreen)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="principal" stroke={BLUE} fill="none" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {mode === 'draw' && (
        <div style={{
          padding: 'clamp(18px, 4vw, 28px)',
          background: '#f4f4f2',
          borderRadius: '14px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            {(age + ddStart)}歳から月{ddAmount}万円取り崩し（年利{ddRate}%）
          </div>
          <div style={{ fontSize: 'clamp(28px, 8vw, 40px)', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.1, color: drawdown.depletedYear !== null ? RED : GREEN }}>
            {drawdown.depletedYear !== null
              ? Math.floor(drawdown.depletedYear) + '年で枯渇'
              : '100年以上維持'}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            開始時資産 {fmt(sim.points[Math.min(ddStart, sim.points.length - 1)]?.asset || 0)}万円
            {drawdown.depletedYear !== null && ' · 枯渇年齢 約' + Math.floor(age + ddStart + drawdown.depletedYear) + '歳'}
          </div>

          <div style={{ height: '220px', marginTop: '16px', marginLeft: '-8px', marginRight: '-8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdown.pts} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="lpRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GREEN} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis
                  dataKey="y"
                  tick={{ fontSize: 11, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v + '年'}
                />
                <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} width={52} />
                <Tooltip
                  formatter={(v, name) => [fmt(v) + '万円', name === 'a' ? '残高' : '取崩累計']}
                  labelFormatter={l => l + '年後'}
                  contentStyle={{
                    background: '#fff',
                    border: '0.5px solid rgba(0,0,0,0.15)',
                    borderRadius: '8px', fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="a" stroke={GREEN} fill="url(#lpRed)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="cum" stroke={AMBER} fill="none" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '4px',
        background: '#f4f4f2',
        padding: '4px',
        borderRadius: '10px',
        marginBottom: '16px',
      }}>
        <TabButton active={activeTab === 'income'} onClick={() => setActiveTab('income')}>収入・家族</TabButton>
        <TabButton active={activeTab === 'expense'} onClick={() => setActiveTab('expense')}>支出</TabButton>
        <TabButton active={activeTab === 'invest'} onClick={() => setActiveTab('invest')}>投資</TabButton>
        <TabButton active={activeTab === 'result'} onClick={() => setActiveTab('result')}>結果</TabButton>
      </div>

      {activeTab === 'income' && (
        <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
          <Card>
            <Label>現在の年齢</Label>
            <SliderRow>
              <input type="range" min="18" max="80" step="1" value={age} onChange={e => setAge(+e.target.value)} style={{ flex: 1 }} />
              <ValueText>{age}歳</ValueText>
            </SliderRow>
          </Card>
          <Card>
            <Label>年収（額面、万円）</Label>
            <SliderRow>
              <input type="range" min="200" max="3000" step="10" value={income} onChange={e => setIncome(+e.target.value)} style={{ flex: 1 }} />
              <ValueText>{income}万</ValueText>
            </SliderRow>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
              手取り月収 約{netMonthly(income).toFixed(1)}万円
            </div>
          </Card>
          <Card>
            <Label>現在の貯蓄（万円）</Label>
            <SliderRow>
              <input type="range" min="0" max="5000" step="10" value={savings} onChange={e => setSavings(+e.target.value)} style={{ flex: 1 }} />
              <ValueText>{savings}万</ValueText>
            </SliderRow>
          </Card>
          <Card>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', marginBottom: partnerOn ? '12px' : 0 }}>
              <input type="checkbox" checked={partnerOn} onChange={e => setPartnerOn(e.target.checked)} />
              配偶者・パートナーあり
            </label>
            {partnerOn && (
              <div>
                <Label>パートナーの年収（万円）</Label>
                <SliderRow>
                  <input type="range" min="0" max="2000" step="10" value={pIncome} onChange={e => setPIncome(+e.target.value)} style={{ flex: 1 }} />
                  <ValueText>{pIncome}万</ValueText>
                </SliderRow>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
                  手取り月収 約{netMonthly(pIncome).toFixed(1)}万円
                </div>
              </div>
            )}
          </Card>
          <Card>
            <Label>子供の人数</Label>
            <SliderRow>
              <input type="range" min="0" max="5" step="1" value={children} onChange={e => setChildren(+e.target.value)} style={{ flex: 1 }} />
              <ValueText>{children}人</ValueText>
            </SliderRow>
            {children > 0 && (
              <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
                {Array.from({ length: children }).map((_, i) => (
                  <div key={i}>
                    <Label>子供{i + 1}の現在の年齢</Label>
                    <SliderRow>
                      <input type="range" min="0" max="22" step="1" value={childAges[i] || 0} onChange={e => updateChildAge(i, +e.target.value)} style={{ flex: 1 }} />
                      <ValueText>{childAges[i] || 0}歳</ValueText>
                    </SliderRow>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                      {childStage(childAges[i] || 0).label}（月{childStage(childAges[i] || 0).cost}万）
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'expense' && (
        <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
          <Card>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>月の基本支出（万円）</div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {expenses.map(e => (
                <div key={e.id}>
                  <Label>{e.icon} {e.label}</Label>
                  <SliderRow>
                    <input type="range" min="0" max="30" step="0.5" value={e.val || 0} onChange={ev => updateExpense(e.id, +ev.target.value)} style={{ flex: 1 }} />
                    <ValueText>{(e.val || 0).toFixed(1)}万</ValueText>
                  </SliderRow>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '0.5px dashed rgba(0,0,0,0.1)', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>基本支出 合計</span>
                <span style={{ fontWeight: 500 }}>{baseExpTotal.toFixed(1)} 万円/月</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: '#666' }}>収入（手取り）</span>
                <span style={{ fontWeight: 500 }}>{incomeNetMonthly.toFixed(1)} 万円/月</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: '#666' }}>余剰</span>
                <span style={{ fontWeight: 500, color: incomeNetMonthly - baseExpTotal >= 0 ? GREEN : RED }}>
                  {(incomeNetMonthly - baseExpTotal).toFixed(1)} 万円/月
                </span>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>ライフステージ別の支出率</div>
            <Label>子育て期（基本支出 × {rateChild}%）</Label>
            <SliderRow>
              <input type="range" min="50" max="200" step="5" value={rateChild} onChange={e => setRateChild(+e.target.value)} style={{ flex: 1 }} />
              <ValueText>{rateChild}%</ValueText>
            </SliderRow>
            <div style={{ marginTop: '10px' }}>
              <Label>空の巣期（基本支出 × {rateEmpty}%）</Label>
              <SliderRow>
                <input type="range" min="50" max="200" step="5" value={rateEmpty} onChange={e => setRateEmpty(+e.target.value)} style={{ flex: 1 }} />
                <ValueText>{rateEmpty}%</ValueText>
              </SliderRow>
            </div>
            <div style={{ marginTop: '10px' }}>
              <Label>老後期（基本支出 × {rateRetire}%）</Label>
              <SliderRow>
                <input type="range" min="40" max="150" step="5" value={rateRetire} onChange={e => setRateRetire(+e.target.value)} style={{ flex: 1 }} />
                <ValueText>{rateRetire}%</ValueText>
              </SliderRow>
            </div>
          </Card>
          <Card>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input type="checkbox" checked={inflationOn} onChange={e => setInflationOn(e.target.checked)} />
              インフレを考慮する
            </label>
            {inflationOn && (
              <div style={{ marginTop: '12px' }}>
                <Label>インフレ率（年）</Label>
                <SliderRow>
                  <input type="range" min="0" max="10" step="0.1" value={inflation} onChange={e => setInflation(+e.target.value)} style={{ flex: 1 }} />
                  <ValueText>{inflation.toFixed(1)}%</ValueText>
                </SliderRow>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'invest' && (
        <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
          <Card>
            <Label>シミュレーション期間</Label>
            <SliderRow>
              <input type="range" min="1" max="60" step="1" value={years} onChange={e => setYears(+e.target.value)} style={{ flex: 1 }} />
              <ValueText>{years}年</ValueText>
            </SliderRow>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
              {age}歳 → {age + years}歳
            </div>
          </Card>
          <Card>
            <Label>想定年利（運用利回り）</Label>
            <SliderRow>
              <input type="range" min="0" max="15" step="0.1" value={rate} onChange={e => setRate(+e.target.value)} style={{ flex: 1 }} />
              <ValueText>{rate.toFixed(1)}%</ValueText>
            </SliderRow>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
              S&P500 約7-10% / オルカン 約7-8% / 預金 0.001%
            </div>
          </Card>
          <Card>
            <Label>月の投資額（0なら余剰の25%を自動投資）</Label>
            <SliderRow>
              <input type="range" min="0" max="50" step="0.5" value={manualInvest} onChange={e => setManualInvest(+e.target.value)} style={{ flex: 1 }} />
              <ValueText>{manualInvest.toFixed(1)}万</ValueText>
            </SliderRow>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
              {manualInvest === 0
                ? '自動: 月の余剰額の25%を投資（余剰がない年は投資ゼロ）'
                : '固定: 月' + manualInvest.toFixed(1) + '万を投資（ただし余剰額を上限）'}
            </div>
          </Card>

          <Card style={{ background: '#f9f9f7' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>取り崩しシミュレーション設定</div>
            <Label>何年後から取り崩す（{age + ddStart}歳から）</Label>
            <SliderRow>
              <input type="range" min="0" max={Math.max(years, 1)} step="1" value={Math.min(ddStart, years)} onChange={e => setDdStart(+e.target.value)} style={{ flex: 1 }} />
              <ValueText>{ddStart}年後</ValueText>
            </SliderRow>
            <div style={{ marginTop: '10px' }}>
              <Label>月の取り崩し額（万円）</Label>
              <SliderRow>
                <input type="range" min="1" max="50" step="0.5" value={ddAmount} onChange={e => setDdAmount(+e.target.value)} style={{ flex: 1 }} />
                <ValueText>{ddAmount.toFixed(1)}万</ValueText>
              </SliderRow>
            </div>
            <div style={{ marginTop: '10px' }}>
              <Label>取り崩し期間中の運用利回り</Label>
              <SliderRow>
                <input type="range" min="0" max="10" step="0.1" value={ddRate} onChange={e => setDdRate(+e.target.value)} style={{ flex: 1 }} />
                <ValueText>{ddRate.toFixed(1)}%</ValueText>
              </SliderRow>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'result' && (
        <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
          <Card>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>ライフステージ別の月収支（代表年）</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 6px', color: '#666', fontWeight: 500 }}>ステージ</th>
                    <th style={{ textAlign: 'right', padding: '8px 6px', color: '#666', fontWeight: 500 }}>年齢</th>
                    <th style={{ textAlign: 'right', padding: '8px 6px', color: '#666', fontWeight: 500 }}>収入</th>
                    <th style={{ textAlign: 'right', padding: '8px 6px', color: '#666', fontWeight: 500 }}>支出</th>
                    <th style={{ textAlign: 'right', padding: '8px 6px', color: '#666', fontWeight: 500 }}>投資</th>
                    <th style={{ textAlign: 'right', padding: '8px 6px', color: '#666', fontWeight: 500 }}>余剰</th>
                  </tr>
                </thead>
                <tbody>
                  {stageSummary.map(s => (
                    <tr key={s.stage} style={{ borderBottom: '0.5px dashed rgba(0,0,0,0.06)' }}>
                      <td style={{ padding: '8px 6px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                          background: STAGE_COLOR[s.stage] + '20', color: STAGE_COLOR[s.stage],
                          fontSize: '11px', fontWeight: 500,
                        }}>{STAGE_LABEL[s.stage]}</span>
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right' }}>{s.age}歳</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right' }}>{s.income.toFixed(1)}万</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right' }}>{s.expense.toFixed(1)}万</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right' }}>{s.invest.toFixed(1)}万</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', color: s.surplus > 0 ? GREEN : RED, fontWeight: 500 }}>
                        {s.surplus.toFixed(1)}万
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>
              取り崩し感度分析（{fmt(sim.points[Math.min(ddStart, sim.points.length - 1)]?.asset || 0)}万円スタート、何年持つか）
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 4px', color: '#666', fontWeight: 500 }}>月額\利回り</th>
                    {sensitivity.rateOptions.map(r => (
                      <th key={r} style={{ textAlign: 'right', padding: '6px 4px', color: '#666', fontWeight: 500 }}>{r}%</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensitivity.grid.map(row => (
                    <tr key={row.m} style={{ borderBottom: '0.5px dashed rgba(0,0,0,0.06)' }}>
                      <td style={{ padding: '6px 4px', fontWeight: 500 }}>{row.m}万</td>
                      {row.cells.map((c, i) => {
                        const isCurrent = row.m === ddAmount && c.r === ddRate
                        let label = c.depleted ? Math.floor(c.years) + '年' : '∞'
                        let bg = 'transparent'
                        if (isCurrent) bg = AMBER + '30'
                        else if (!c.depleted) bg = GREEN + '15'
                        else if (c.years >= 30) bg = GREEN + '10'
                        else if (c.years >= 20) bg = AMBER + '15'
                        else bg = RED + '15'
                        return (
                          <td key={i} style={{
                            padding: '6px 4px', textAlign: 'right',
                            background: bg,
                            fontWeight: isCurrent ? 600 : 400,
                            color: isCurrent ? AMBER : '#0a0a0a',
                            border: isCurrent ? '1px solid ' + AMBER : 'none',
                          }}>{label}</td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
              ハイライト = 現在の設定（月{ddAmount}万・利回り{ddRate}%）
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>主要な数字</div>
            <Stat label="開始時の貯蓄" value={fmt(savings) + '万円'} />
            <Stat label={(age + years) + '歳時点の予想資産'} value={fmt(sim.finalAsset) + '万円'} color={GREEN} />
            <Stat label="累積投資額（元本）" value={fmt(sim.totalInvested) + '万円'} />
            <Stat label="運用益" value={fmt(sim.gain) + '万円'} color={sim.gain >= 0 ? GREEN : RED} />
            <Stat label={'取り崩し開始（' + (age + ddStart) + '歳）の資産'}
              value={fmt(sim.points[Math.min(ddStart, sim.points.length - 1)]?.asset || 0) + '万円'}
              color={AMBER}
            />
            <Stat label="取り崩し時の枯渇までの年数"
              value={drawdown.depletedYear !== null ? Math.floor(drawdown.depletedYear) + '年' : '100年以上'}
              color={drawdown.depletedYear !== null ? RED : GREEN}
            />
          </Card>
        </div>
      )}

      <div style={{
        fontSize: '11px', color: '#888',
        lineHeight: 1.6, marginTop: '24px',
        paddingTop: '16px', borderTop: '0.5px solid rgba(0,0,0,0.08)',
      }}>
        ※ 簡易試算であり、将来を保証するものではありません。手取りは累進税率＋社保15%相当を控除した概算です。月の投資額は「月の余剰額の25%」を自動投資する設計（手動指定可）。子育てコストは学齢別の標準額を加算。インフレONの場合、収入・支出ともに名目で上昇します。取り崩し感度分析は、指定年時点の資産から月一定額を引きながら年複利で運用した場合に何年持つかを示します。
      </div>
    </div>
  )
}
