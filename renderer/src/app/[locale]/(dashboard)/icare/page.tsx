'use client';
import TitleHeader from '@/components/layout/Title/TitleHeader';
import useTranslationData from '@/hooks/use-translation-data';
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import { withLazyLoad } from '@/provider/LazyLoad';
import { ExerciseCardData, HospitalCardData, ProductCardData } from '@/types';
import { useState } from 'react';
import styles from './IcarePage.module.css';

// Lazy load components
const LazyExerciseCard = withLazyLoad(() => import('@/components/icare/ExerciseCard/ExerciseCard'));
const LazyExerciseModal = withLazyLoad(
	() => import('@/components/icare/ExerciseModal/ExerciseModal')
);
const LazyHospitalCard = withLazyLoad(() => import('@/components/icare/HospitalCard/hospitalCard'));
const LazyHospitalModal = withLazyLoad(
	() => import('@/components/icare/HospitalModal/HospitalModal')
);
const LazyProductCard = withLazyLoad(() => import('@/components/icare/ProductCard/ProductCard'));
const LazyProductModal = withLazyLoad(() => import('@/components/icare/ProductModal/ProductModal'));

export default function ICarePage() {
	const { ExerciseData, hospitalsData, productsData, icarePageText } = useTranslationData();

	const [selectedProduct, setSelectedProduct] = useState<ProductCardData | null>(null);
	const [isProductModalOpen, setIsProductModalOpen] = useState(false);
	const [selectedExercise, setSelectedExercise] = useState<ExerciseCardData | null>(null);
	const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
	const [selectedHospital, setSelectedHospital] = useState<HospitalCardData | null>(null);
	const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);

	const { metrics } = useEyeTrackingContext();

	const handleHospitalCardClick = (hospital: HospitalCardData) => {
		setSelectedHospital(hospital);
		setIsHospitalModalOpen(true);
	};

	const handleCloseHospitalModal = () => {
		setIsHospitalModalOpen(false);
		setSelectedHospital(null);
	};

	const handleProductClick = (product: ProductCardData) => {
		setSelectedProduct(product);
		setIsProductModalOpen(true);
	};

	const handleCloseProductModal = () => {
		setIsProductModalOpen(false);
		setSelectedProduct(null);
	};

	const handleExerciseClick = (exercise: ExerciseCardData) => {
		setSelectedExercise(exercise);
		setIsExerciseModalOpen(true);
	};

	const handleCloseExerciseModal = () => {
		setIsExerciseModalOpen(false);
		setSelectedExercise(null);
	};
	return (
		<div className={styles.container}>
			<>
				<TitleHeader title={icarePageText.sectionTitles.eyeExercises} />
				<div className={styles.mainSection}>
					{ExerciseData.map((exercise) => (
						<LazyExerciseCard
							key={exercise.title}
							title={exercise.title}
							image={exercise.image}
							youtubeUrl={exercise.youtubeUrl}
							description={exercise.description}
							onClick={() => handleExerciseClick(exercise)}
						/>
					))}
				</div>
			</>
			<>
				<TitleHeader title={icarePageText.sectionTitles.eyeProducts} />
				<div className={styles.mainSection}>
					{productsData.map((product) => (
						<LazyProductCard
							key={product.key}
							title={product.title}
							description={product.description}
							image={product.image}
							price={product.price}
							amazonUrl={product.amazonUrl}
							detailedDescription={product.detailedDescription}
							onClick={() => handleProductClick(product)}
						/>
					))}
				</div>
			</>
			<>
				<TitleHeader title={icarePageText.sectionTitles.eyeSpecialists} />
				<div className={styles.mainSection}>
					{hospitalsData.map((hospital) => (
						<LazyHospitalCard
							key={hospital.title}
							title={hospital.title}
							image={hospital.image}
							onClick={() => handleHospitalCardClick(hospital)}
						/>
					))}
				</div>
			</>

			{isProductModalOpen && (
				<LazyProductModal
					isOpen={isProductModalOpen}
					onClose={handleCloseProductModal}
					product={selectedProduct}
				/>
			)}

			{isExerciseModalOpen && (
				<LazyExerciseModal
					isOpen={isExerciseModalOpen}
					onClose={handleCloseExerciseModal}
					exercise={selectedExercise}
					currentMetrics={metrics}
				/>
			)}

			{isHospitalModalOpen && (
				<LazyHospitalModal
					isOpen={isHospitalModalOpen}
					onClose={handleCloseHospitalModal}
					hospital={selectedHospital}
				/>
			)}
		</div>
	);
}
