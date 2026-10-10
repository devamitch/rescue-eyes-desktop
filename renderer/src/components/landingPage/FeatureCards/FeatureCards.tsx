import React from 'react';
import styles from './FeatureCards.module.css';
import { FeatureCardsProps } from '@/types';



function FeatureCards({ features }: FeatureCardsProps) {
  return (
    <div className={styles.grid}>
      {features.map((feature) => (
        <div key={feature.title} className={styles.card}>
          <div className={styles.content}>
            <div className={styles.cardHeader}>
                {feature.icon &&  <feature.icon className={styles.icon} />}
             
              <div className={styles.title}>
                {feature.title}
              </div>
              <div className={styles.description}>
                {feature.description}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FeatureCards;