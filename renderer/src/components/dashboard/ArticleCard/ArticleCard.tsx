'use client';

import { ArticleCardData } from '@/types';
import Image from 'next/image';
import Styles from './ArticleCard.module.css';

export default function ArticleCard({ title, description, image }: ArticleCardData) {
	return (
		<div className={Styles.card}>
			<Image src={image} alt={title} width={300} height={200} className={Styles.image} />

			<div className={Styles.content}>
				<h3 className={Styles.title}>{title}</h3>
			</div>
		</div>
	);
}
