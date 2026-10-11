export default function Footer() {
  const currentYear =
    new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer-content">
        <div className="footer-brand-section">
          <div className="footer-brand">
            <div className="footer-brand-mark">
              T
            </div>

            <div>
              <h3>
                TeamSpace
              </h3>

              <p>
                Real-time team
                collaboration,
                messaging and task
                management in one
                workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="footer-links-section">
          <h4>
            Quick Links
          </h4>

          <div className="footer-links">
            <a href="/dashboard">
              Dashboard
            </a>

            <a href="/channels">
              Channels
            </a>

            <a href="/messages">
              Messages
            </a>

            <a href="/tasks">
              Tasks
            </a>
          </div>
        </div>

        <div className="footer-contact-section">
          <h4>
            Contact
          </h4>

          <p>
            hassaanatif5@gmail.com
          </p>

          <p>
            +92 310 5259908
          </p>
        </div>
      </div>

      <div className="app-footer-bottom">
        <p>
          © {currentYear} Muhammad
          Hassaan. All rights
          reserved.
        </p>

        <span>
          Built with React, Node.js,
          Express, MongoDB & Socket.IO
        </span>
      </div>
    </footer>
  );
}