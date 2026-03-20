import Link from 'next/link';
import pkg from '@/package.json';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'Docs', href: '/docs' },
  ],
  Company: [
    { label: 'About', href: 'https://id8labs.app' },
    { label: 'Blog', href: 'https://id8labs.app/blog' },
    { label: 'Contact', href: 'mailto:hello@id8labs.app' },
  ],
  Legal: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
  ],
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-columns">
        {Object.entries(FOOTER_LINKS).map(([group, links]) => (
          <div key={group} className="footer-col">
            <h4 className="footer-col-title">{group}</h4>
            <ul className="footer-col-links">
              {links.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('http') || link.href.startsWith('mailto') ? (
                    <a
                      href={link.href}
                      className="footer-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="footer-link">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <div className="footer-brand">
          <span className="footer-logo">id8Labs</span>
          <span className="footer-version">v{pkg.version}</span>
        </div>
        <span className="footer-copy">{year} id8Labs LLC. All rights reserved.</span>
      </div>
    </footer>
  );
}
