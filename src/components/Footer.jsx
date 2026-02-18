export default function Footer() {
  return (
    <footer className="content-footer footer bg-footer-theme">
      <div className="container-xxl d-flex justify-content-between py-2">
        <div>
          © {new Date().getFullYear()} — made with ❤️ by <b>ThemeSelection</b>
        </div>
        <div>
          <a href="#" className="footer-link me-3">License</a>
          <a href="#" className="footer-link me-3">Docs</a>
          <a href="#" className="footer-link">Support</a>
        </div>
      </div>
    </footer>
  );
}
