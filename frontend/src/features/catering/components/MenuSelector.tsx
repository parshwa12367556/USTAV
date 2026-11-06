import type { CateringMenu } from '../api/cateringApi';
import { formatCurrency } from '../../../utils/formatCurrency';
export function MenuSelector({ menus, value, onChange }: { menus: CateringMenu[]; value?: string; onChange: (menuId: string) => void }) {
  return <div className="menu-selector">{menus.map((menu) => <label key={menu.id}>
    <input type="radio" name="catering-menu" value={menu.id} checked={value === menu.id} onChange={() => onChange(menu.id)} />
    <span><strong>{menu.name}</strong>{menu.description && <small>{menu.description}</small>}<span>{formatCurrency(menu.pricePerPlate)} / plate</span></span>
  </label>)}</div>;
}
