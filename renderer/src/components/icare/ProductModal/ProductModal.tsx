import useTranslationData from '@/hooks/use-translation-data';
import { ProductCardData } from '@/types';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import styles from './ProductModal.module.css';
import Dialog from '@/components/layout/Modal/Dialog';

interface ProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: ProductCardData | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product }) => {
	const { productModalText } = useTranslationData();

	if (!product) return null;

	const handleBuyNow = () => {
		if (product.amazonUrl) {
			window.open(product.amazonUrl, '_blank', 'noopener,noreferrer');
		}
	};

	return (
		<Dialog isOpen={isOpen} onClose={onClose}>
			<div className={styles.productContainer}>		
                <Image
					src={product.image}
					alt={product.title}
					width={300}
					height={200}
					className={styles.productImage}
				/>

				<div className={styles.detailsSection}>
					<h1 className={styles.productTitle}>{product.title}</h1>
					<p className={styles.productDescription}>{product.description}</p>
					<div className={styles.detailedDescription}>
						<h3>{productModalText.aboutProduct}</h3>
						<p>{product.detailedDescription}</p>
					</div>
					<div className={styles.actions}>
						<button className={styles.buyButton} onClick={handleBuyNow}>
							<ExternalLink size={16} />
							{productModalText.buyNow}
						</button>
					</div>
				</div>
			</div>
		</Dialog>
	);
};

export default ProductModal;
