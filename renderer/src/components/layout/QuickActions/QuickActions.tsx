'use client';

import { 
  ChartSpline, 
  Hospital, 
  RectangleGoggles,  
  ShoppingBag, 
  Upload 
} from 'lucide-react';
import styles from './QuickActions.module.css';

const actions = [
 
  {
    icon: RectangleGoggles,
    label: 'Goggles',
  },
  {
    icon: ChartSpline,
    label: 'Chart',
  },
  {
    icon: ShoppingBag,
    label: 'Shopping Bag',
  },
  {
    icon: Hospital,
    label: 'Hospital',
  },
   {
    icon: Upload,
    label: 'Upload',
  },
];

export function QuickActions() {
  return (
    <div className={styles.quickActions}>
      {actions.map((action, index) => (
        <button
          key={action.label}
          className={styles.actionButton}
          title={action.label}
        >
          <action.icon size={40} />
        </button>
      ))}
    </div>
  );
}
