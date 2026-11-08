import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const featureCards = [
  ['✦', 'Event management', 'Plan celebrations and keep each function’s details together.'],
  ['✉', 'Digital invitations', 'Personalize invitation designs and share them with your guests.'],
  ['♧', 'Guest management', 'Organize your guest list and keep important details in one place.'],
  ['✓', 'RSVP tracking', 'Follow responses across your event and its individual functions.'],
  ['⌂', 'Venue booking', 'Explore venues and keep enquiries connected to your celebration.'],
  ['♨', 'Catering management', 'Compare catering options and plan menus for your gathering.'],
  ['❋', 'Decoration services', 'Explore decor inspiration and organize service enquiries.'],
  ['✧', 'Vendor marketplace', 'Discover service categories and manage vendor conversations.'],
  ['₹', 'Quotation management', 'Request, compare, and keep track of vendor quotations.'],
  ['▣', 'Bookings & payments', 'Keep booking details and payment records organized.'],
  ['◔', 'Budget management', 'Plan your budget and follow expenses as details come together.'],
  ['◷', 'Notifications & reminders', 'Keep important planning updates close at hand.'],
];

const steps = [
  {
    number: '01',
    title: 'Create your event',
    detail: 'Register your family account, add your wedding details, and create the functions you want to celebrate.',
  },
  {
    number: '02',
    title: 'Invite your guests',
    detail: 'Choose a design, personalize the invitation, and share its link with the people who matter.',
  },
  {
    number: '03',
    title: 'Manage your celebration',
    detail: 'Track guest responses, organize vendors, and coordinate venues and services.',
  },
  {
    number: '04',
    title: 'Celebrate without stress',
    detail: 'Keep bookings, budgets, and every function organized in one thoughtful workspace.',
  },
];

const services = [
  'Wedding & event venues',
  'Catering',
  'Decoration',
  'Photography & videography',
  'Makeup artists',
  'Transportation',
  'Entertainment',
  'Event management',
  'Other wedding services',
];

const reasons = [
  'All your wedding planning in one place',
  'An easy-to-manage guest list',
  'Invitations designed to share digitally',
  'Function-wise RSVP tracking',
  'Vendor and quotation management',
  'Clearer budget and expense tracking',
  'A shared space for family collaboration',
];

const sectionForPath: Record<string, string> = {
  '/features': 'features',
  '/how-it-works': 'how-it-works',
  '/services': 'services',
  '/about': 'about',
  '/contact': 'contact',
};

function Brand() {
  return (
    <Link className="landing-brand" to="/" aria-label="UTSAV home">
      <span className="landing-brand-mark" aria-hidden="true">u</span>
      <span>UTSAV<span className="landing-brand-period">.</span></span>
    </Link>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const targetId = hash.slice(1) || sectionForPath[pathname];
    if (!targetId) return;
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [hash, pathname]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <Brand />
        <button
          className="landing-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="landing-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>
        <nav id="landing-navigation" className={`landing-navigation${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          <Link to="/#home" onClick={closeMenu}>Home</Link>
          <Link to="/#features" onClick={closeMenu}>Features</Link>
          <Link to="/#how-it-works" onClick={closeMenu}>How It Works</Link>
          <Link to="/#services" onClick={closeMenu}>Services</Link>
          <Link to="/#about" onClick={closeMenu}>About Us</Link>
          <Link to="/#contact" onClick={closeMenu}>Contact</Link>
          <div className="landing-mobile-actions">
            <Link to="/login" onClick={closeMenu}>Login</Link>
            <Link className="landing-button landing-button--primary" to="/register" onClick={closeMenu}>Get Started</Link>
          </div>
        </nav>
        <div className="landing-header-actions">
          <Link className="landing-login" to="/login">Login</Link>
          <Link className="landing-button landing-button--primary" to="/register">Get Started</Link>
        </div>
      </header>

      <main>
        <section className="landing-hero" id="home">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow"><i /> Every Celebration, One Place.</span>
            <h1>Your Dream Wedding,<br /><em>Perfectly Planned.</em></h1>
            <p>Plan every celebration, manage guests, create beautiful invitations and discover trusted wedding vendors — all in one place.</p>
            <div className="landing-hero-actions">
              <Link className="landing-button landing-button--primary" to="/register">Start Planning <span aria-hidden="true">→</span></Link>
              <Link className="landing-button landing-button--outline" to="/#features">Explore Features</Link>
            </div>
            <div className="landing-hero-note"><span aria-hidden="true">✦</span> Thoughtful tools for the moments that matter.</div>
          </div>
          <div className="landing-hero-visual">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85"
              alt="Warmly decorated wedding celebration with flowers and golden lights"
            />
            <div className="landing-image-shade" />
            <div className="landing-visual-label"><span>✿</span><div><strong>Made for your moment</strong><small>Every detail, thoughtfully together</small></div></div>
            <span className="landing-visual-seal" aria-hidden="true">U</span>
          </div>
          <span className="landing-hero-flower landing-hero-flower--one" aria-hidden="true">✿</span>
          <span className="landing-hero-flower landing-hero-flower--two" aria-hidden="true">✧</span>
        </section>

        <section className="landing-section landing-features" id="features">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">YOUR CELEBRATION, IN GOOD HANDS</span>
            <h2>Every moving piece,<br /><em>finding its place.</em></h2>
            <p>From the first guest list to the final details, bring your planning into one calm, connected space.</p>
          </div>
          <div className="landing-feature-grid">
            {featureCards.map(([icon, title, description], index) => (
              <article className="landing-feature-card" key={title}>
                <span className="landing-feature-icon" aria-hidden="true">{icon}</span>
                <span className="landing-feature-index">{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-process" id="how-it-works">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">A LOVELY WAY TO GET STARTED</span>
            <h2>Four steps to a more<br /><em>joyful celebration.</em></h2>
          </div>
          <div className="landing-step-grid">
            {steps.map((step) => (
              <article className="landing-step" key={step.number}>
                <span className="landing-step-number">{step.number}</span>
                <span className="landing-step-rule" />
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-services" id="services">
          <div className="landing-services-intro">
            <span className="landing-eyebrow">A PLACE FOR ALL YOUR PLANS</span>
            <h2>Find the services<br /><em>your day calls for.</em></h2>
            <p>UTSAV helps you explore service categories and keep planning conversations connected to your event.</p>
            <Link className="landing-text-link" to="/register">Explore UTSAV <span aria-hidden="true">→</span></Link>
          </div>
          <div className="landing-service-list">
            {services.map((service, index) => (
              <div className="landing-service-item" key={service}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{service}</strong>
                <span aria-hidden="true">↗</span>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-why" id="about">
          <div className="landing-why-art" aria-hidden="true">
            <div className="landing-why-arch"><span>✿</span><b>Made with<br />your people<br />in mind.</b><i>✦</i></div>
            <span className="landing-why-spark landing-why-spark--one">✧</span>
            <span className="landing-why-spark landing-why-spark--two">✿</span>
          </div>
          <div className="landing-why-copy">
            <span className="landing-eyebrow">WHY UTSAV</span>
            <h2>A little more together.<br /><em>A lot more in the moment.</em></h2>
            <p>Big celebrations bring many details and many people together. UTSAV gives your family one place to plan, share, and keep track.</p>
            <ul>{reasons.map((reason) => <li key={reason}><span aria-hidden="true">✓</span>{reason}</li>)}</ul>
          </div>
        </section>

        <section className="landing-cta" id="contact">
          <span className="landing-cta-flower" aria-hidden="true">✿</span>
          <span className="landing-eyebrow">EVERY CELEBRATION, ONE PLACE</span>
          <h2>Start Planning Your Perfect<br />Celebration Today.</h2>
          <p>Bring every wedding detail together with UTSAV.</p>
          <Link className="landing-button landing-button--light" to="/register">Get Started <span aria-hidden="true">→</span></Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-main">
          <div className="landing-footer-brand">
            <Brand />
            <p>Every Celebration, One Place.</p>
          </div>
          <div className="landing-footer-column"><strong>Explore</strong><Link to="/#features">Features</Link><Link to="/#how-it-works">How It Works</Link><Link to="/#services">Services</Link></div>
          <div className="landing-footer-column"><strong>UTSAV</strong><Link to="/#about">About Us</Link><Link to="/#contact">Contact</Link></div>
          <div className="landing-footer-column"><strong>Get started</strong><Link to="/login">Login</Link><Link to="/register">Create an account</Link></div>
        </div>
        <div className="landing-footer-bottom">
          <span>© {new Date().getFullYear()} UTSAV. All rights reserved.</span>
          <span className="landing-footer-legal"><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms &amp; Conditions</Link></span>
        </div>
      </footer>
    </div>
  );
}
