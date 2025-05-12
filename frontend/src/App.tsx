import { Routes, Route, Link } from 'react-router-dom'

import Home from '@/pages/Home'
import About from '@/pages/About'
import '@/App.css'


export default function App() {
  return (
    <div>
      {/* <nav style={styles.nav}>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/about" style={styles.link}>About</Link>
      </nav> */}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  )
}
