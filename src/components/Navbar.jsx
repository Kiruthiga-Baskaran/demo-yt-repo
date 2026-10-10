export default function Navbar() {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href="#" className="logo">
          0 <span className="logo-arrow">→</span> Shipped
        </a>
        <div className="nav-links">
          <a href="#parser">Parser</a>
          <a href="#how">How it works</a>
          <a href="#" className="btn btn-small">
            Get started
          </a>
        </div>
      </div>
    </nav>
  );
}
