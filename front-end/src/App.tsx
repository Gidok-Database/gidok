import { Routes, Route, Link } from 'react-router-dom'

import Home from '@/pages/Home'
import About from '@/pages/About'
import '@/App.css'


export default function App() {
  return (
    <div style={styles.wrapper}>
      <nav style={styles.nav}>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/about" style={styles.link}>About</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  )
}

const styles = {
  wrapper: { padding: '1rem' },
  nav: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    borderBottom: '1px solid #ccc',
    paddingBottom: '0.5rem',
  },
  link: {
    textDecoration: 'none',
    color: '#007acc',
    fontWeight: 'bold' as const,
  },
}