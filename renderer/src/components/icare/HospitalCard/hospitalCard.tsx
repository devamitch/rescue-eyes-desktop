'use client';

import React from 'react';
import Image from 'next/image';
import Styles from './HospitalCard.module.css';


interface HospitalCardProps {
    onClick?: () => void;
        title: string;
            image: string;
}

export default function HospitalCard({ title,  image, onClick }: HospitalCardProps) {
    return (
              <div className={Styles.card} onClick={onClick}>
                <Image
                    src={image}
                    alt={title}
                    width={300}
                    height={200}
                    className={Styles.image}
                />

            <div className={Styles.content}>
                <h3 className={Styles.title}>
                    {title}
                </h3>
            </div>
        </div>
    );
}
