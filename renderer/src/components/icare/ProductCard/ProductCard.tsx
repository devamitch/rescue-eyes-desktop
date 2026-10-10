import React from 'react'
import Styles from './ProductCard.module.css'
import { ProductCardData } from '@/types';
import Image from 'next/image';

interface ProductCardProps extends ProductCardData {
    onClick: () => void;
}

function ProductCard({ title, description, image, onClick }: ProductCardProps) {
    return (
        <div className={Styles.card} onClick={onClick}>
            <Image
                src={image}
                alt={title}
                width={150}
                height={150}
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

export default ProductCard