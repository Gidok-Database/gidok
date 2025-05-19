import { Routes, Route, Link } from 'react-router-dom';

import Home from '@/pages/Home/Home';
import Project from '@/pages/Project/Project';
import CommitDetail from "@/pages/CommitDetail/CommitDetail";
import Login from '@/pages/Login/Login';
import Register from '@/pages/Register/Register';
import '@/App.css';


export default function App() {
  return (
    <div>
      {/* <nav style={styles.nav}>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/about" style={styles.link}>About</Link>
      </nav> */}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:name" element={<Project />} />
        <Route path="/project/:name/commit/:commitId" element={<CommitDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  )
}
