import { Link, useLocation } from 'react-router-dom';

const privacySections = [
  {
    title: 'Information used by UTSAV',
    body: 'UTSAV uses the account details you provide and the planning information you add, such as event details, guest lists, invitations, enquiries, bookings, and budgets, to provide the platform features you choose to use.',
  },
  {
    title: 'Account security',
    body: 'Passwords are stored as password hashes. Browser session tokens are used to authenticate requests; logging out invalidates the current session on the server and clears saved private browser data on this device.',
  },
  {
    title: 'Your planning information',
    body: 'Only add information you are permitted to share, especially when entering details about guests or other family members. Do not use UTSAV to store highly sensitive personal or financial information.',
  },
];

const termsSections = [
  {
    title: 'Using the platform',
    body: 'UTSAV provides digital tools for organizing celebrations, managing guests, invitations, planning services, and related workflows. Keep your account credentials secure and provide accurate information when using the platform.',
  },
  {
    title: 'Guest and event details',
    body: 'You are responsible for the event information and guest details you submit, including making sure you have permission to use and share those details for your event.',
  },
  {
    title: 'Third-party services',
    body: 'Service categories and vendor-management tools help you organize discovery and enquiries. Confirm provider identity, availability, pricing, and agreement terms directly before making a booking or payment.',
  },
];

export default function LegalPage() {
  const { pathname } = useLocation();
  const isPrivacy = pathname === '/privacy';
  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link className="landing-brand" to="/"><span className="landing-brand-mark">u</span><span>UTSAV<span className="landing-brand-period">.</span></span></Link>
        <Link to="/">Back to UTSAV</Link>
      </header>
      <article className="legal-content">
        <span className="landing-eyebrow">UTSAV · DRAFT FOR REVIEW</span>
        <h1>{isPrivacy ? 'Privacy Policy' : 'Terms & Conditions'}</h1>
        <p className="legal-intro">This is an initial overview based on the current UTSAV platform. The service owner should review and approve the final legal terms before public launch.</p>
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
        <p className="legal-updated">Last reviewed: {new Date().toLocaleDateString()}</p>
      </article>
    </main>
  );
}
