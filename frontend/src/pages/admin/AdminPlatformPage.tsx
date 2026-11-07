import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { adminApi, type CommissionRule, type PlatformCategory } from '../../features/admin/api/adminApi';
import { useAuth } from '../../hooks/useAuth';

type AdminSection = 'categories' | 'commissions' | 'reports';

const sectionTitles: Record<AdminSection, { title: string; description: string }> = {
  categories: {
    title: 'Marketplace categories',
    description: 'Manage the service categories families use to browse vendors.',
  },
  commissions: {
    title: 'Commission rules',
    description: 'Set category-based rates with effective dates. Previous rules remain available for history.',
  },
  reports: {
    title: 'Platform reports',
    description: 'Download booking, payment, and paid-commission reports as CSV.',
  },
};

function isAdminSection(value: string | undefined): value is AdminSection {
  return value === 'categories' || value === 'commissions' || value === 'reports';
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminPlatformPage() {
  const { section: rawSection } = useParams();
  const { user, isAuthenticated } = useAuth();
  const section = isAdminSection(rawSection) ? rawSection : 'categories';
  const [categories, setCategories] = useState<PlatformCategory[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [commissionCategory, setCommissionCategory] = useState('');
  const [ratePercent, setRatePercent] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError('');
    const request = section === 'categories'
      ? adminApi.listCategories().then((items) => {
        if (active) setCategories(items);
      })
      : section === 'commissions'
        ? Promise.all([adminApi.listCategories(), adminApi.listCommissionRules()]).then(([items, commissionRules]) => {
          if (active) {
            setCategories(items);
            setRules(commissionRules);
            setCommissionCategory((current) => current || items.find((item) => item.isActive)?.name || '');
          }
        })
        : Promise.resolve();
    request
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load platform settings.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, section, user?.role]);

  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const created = await adminApi.createCategory(categoryName.trim());
      setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryName('');
      setNotice(`Added “${created.name}”.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create the category.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = async (category: PlatformCategory) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await adminApi.setCategoryActive(category.id, !category.isActive);
      setCategories((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice(`${updated.name} is now ${updated.isActive ? 'active' : 'inactive'}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update the category.');
    } finally {
      setSaving(false);
    }
  };

  const saveCommission = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const created = await adminApi.createCommissionRule({
        category: commissionCategory,
        ratePercent: Number(ratePercent),
        effectiveFrom,
      });
      setRules((current) => [created, ...current].sort((a, b) =>
        a.category.localeCompare(b.category) || b.effectiveFrom.localeCompare(a.effectiveFrom),
      ));
      setRatePercent('');
      setNotice(`Commission rule saved for ${created.category}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save the commission rule.');
    } finally {
      setSaving(false);
    }
  };

  const downloadReport = async (type: 'bookings' | 'payments' | 'commissions') => {
    setReporting(true);
    setError('');
    setNotice('');
    try {
      const blob = await adminApi.downloadReport(type, from, to);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `utsav-${type}-report.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice(`${type[0].toUpperCase()}${type.slice(1)} report downloaded.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to download the report.');
    } finally {
      setReporting(false);
    }
  };

  const page = sectionTitles[section];
  return (
    <div className="screen-stack">
      <section className="content-card settings-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ADMINISTRATION</p>
            <h2>{page.title}</h2>
            <p className="section-description">{page.description}</p>
          </div>
        </div>
        {!isAuthenticated || user?.role !== 'admin'
          ? <p className="form-error" role="alert">An administrator account is required.</p>
          : loading
            ? <p role="status">Loading platform settings…</p>
            : <>
              {error && <p className="form-error" role="alert">{error}</p>}
              {notice && <p className="form-success" role="status">{notice}</p>}
              {section === 'categories' && <>
                <form className="settings-form" onSubmit={(event) => void addCategory(event)}>
                  <label>
                    New category
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      value={categoryName}
                      onChange={(event) => setCategoryName(event.currentTarget.value)}
                    />
                  </label>
                  <button className="button button--primary" disabled={saving} type="submit">
                    {saving ? 'Saving…' : 'Add category'}
                  </button>
                </form>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead>
                    <tbody>{categories.map((category) => <tr key={category.id}>
                      <td>{category.name}</td>
                      <td>{category.isActive ? 'Active' : 'Inactive'}</td>
                      <td><button className="button button--outline" type="button" disabled={saving} onClick={() => void toggleCategory(category)}>
                        {category.isActive ? 'Deactivate' : 'Activate'}
                      </button></td>
                    </tr>)}
                      {!categories.length && <tr><td colSpan={3}>No categories yet. Add one above.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>}
              {section === 'commissions' && <>
                <form className="settings-form" onSubmit={(event) => void saveCommission(event)}>
                  <label>Category
                    <select required value={commissionCategory} onChange={(event) => setCommissionCategory(event.currentTarget.value)}>
                      {categories.filter((category) => category.isActive).map((category) =>
                        <option key={category.id} value={category.name}>{category.name}</option>,
                      )}
                    </select>
                  </label>
                  <label>Commission percentage
                    <input required type="number" min="0" max="100" step="0.01" value={ratePercent} onChange={(event) => setRatePercent(event.currentTarget.value)} />
                  </label>
                  <label>Effective from
                    <input required type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.currentTarget.value)} />
                  </label>
                  <button className="button button--primary" disabled={saving || !categories.some((category) => category.isActive)} type="submit">
                    {saving ? 'Saving…' : 'Save rate'}
                  </button>
                </form>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th scope="col">Category</th><th scope="col">Rate</th><th scope="col">Effective from</th></tr></thead>
                    <tbody>{rules.map((rule) => <tr key={rule.id}>
                      <td>{rule.category}</td><td>{rule.ratePercent}%</td><td>{rule.effectiveFrom}</td>
                    </tr>)}
                      {!rules.length && <tr><td colSpan={3}>No commission rules have been configured.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>}
              {section === 'reports' && <>
                <div className="settings-form">
                  <label>From date<input type="date" value={from} onChange={(event) => setFrom(event.currentTarget.value)} /></label>
                  <label>To date<input type="date" value={to} onChange={(event) => setTo(event.currentTarget.value)} /></label>
                </div>
                <p className="section-description">Date filters use the record creation date. Commission exports include paid payments and apply the category rate effective on the payment date.</p>
                <div className="settings-actions">
                  <button className="button button--outline" disabled={reporting} onClick={() => void downloadReport('bookings')}>Export bookings CSV</button>
                  <button className="button button--outline" disabled={reporting} onClick={() => void downloadReport('payments')}>Export payments CSV</button>
                  <button className="button button--primary" disabled={reporting} onClick={() => void downloadReport('commissions')}>Export commissions CSV</button>
                </div>
              </>}
            </>}
      </section>
    </div>
  );
}
