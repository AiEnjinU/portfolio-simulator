import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import PortfolioSimulator from './components/PortfolioSimulator'
import LifePlanSimulator from './components/LifePlanSimulator'

function TopNav() {
  const loc = useLocation()
  const navStyle = {
    display: 'flex',
    gap: '4px',
    padding: '12px 16px',
    background: 'var(--color-background-secondary, #f4f4f2)',
    borderBottom: '0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))',
    maxWidth: '880px',
    margin: '0 auto',
  }
  const tabStyle = (path) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: loc.pathname === path ? 500 : 400,
    background: loc.pathname === path
      ? 'var(--color-background-primary, #fff)'
      : 'transparent',
    color: 'var(--color-text-primary, #0a0a0a)',
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    boxShadow: loc.pathname === path ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
  })
  return (
    <div style={{
      background: 'var(--color-background-secondary, #f4f4f2)',
      borderBottom: '0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))',
    }}>
      <nav style={navStyle}>
        <Link to="/" style={tabStyle('/')}>ポートフォリオ</Link>
        <Link to="/lifeplan" style={tabStyle('/lifeplan')}>ライフプラン</Link>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <div>
      <TopNav />
      <Routes>
        <Route path="/" element={<PortfolioSimulator />} />
        <Route path="/lifeplan" element={<LifePlanSimulator />} />
      </Routes>
    </div>
  )
}
