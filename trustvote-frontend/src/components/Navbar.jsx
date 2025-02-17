import { Link } from 'react-router-dom';
import React from 'react';

function Navbar() {
  return (
    <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
      <Link to="/">Home</Link> |{' '}
      <Link to="/admin">Admin Dashboard</Link> |{' '}
      <Link to="/voter">Voter Dashboard</Link> |{' '}
      <Link to="/results">Election Results</Link>
    </nav>
  );
}

export default Navbar;
