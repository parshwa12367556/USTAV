import { useState, type FormEvent } from 'react';
import type { Expense } from '../../../types/budget.types';
import { Button } from '../../../components/ui/Button';
export function ExpenseForm({ eventId, categories, onSubmit }: { eventId: string; categories: { id: string; name: string }[]; onSubmit: (expense: Omit<Expense, 'id'>) => void }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!description.trim() || !categoryId || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    onSubmit({ eventId, categoryId, description: description.trim(), amount: parsedAmount, date, paid: false });
    setDescription('');
    setAmount('');
  };
  return <form onSubmit={submit}><label>Description<input required value={description} onChange={(event) => setDescription(event.currentTarget.value)} /></label>
    <label>Category<select required value={categoryId} onChange={(event) => setCategoryId(event.currentTarget.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
    <label>Amount<input type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.currentTarget.value)} /></label>
    <label>Date<input type="date" required value={date} onChange={(event) => setDate(event.currentTarget.value)} /></label><Button type="submit">Add expense</Button>
  </form>;
}
