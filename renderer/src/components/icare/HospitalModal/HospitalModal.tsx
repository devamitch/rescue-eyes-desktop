import useTranslationData from '@/hooks/use-translation-data';
import { HospitalCardData } from '@/types';
import Dialog from '@/components/layout/Modal/Dialog';
import { Clock, Globe, MapPin, Phone, Star } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect } from 'react';
import styles from './HospitalModal.module.css';

interface HospitalModalProps {
	isOpen: boolean;
	onClose: () => void;
	hospital: HospitalCardData | null;
}

const HospitalModal: React.FC<HospitalModalProps> = ({ isOpen, onClose, hospital }) => {
	const { hospitalModalText } = useTranslationData();

	useEffect(() => {
		console.log('HospitalModal - isOpen:', isOpen, 'hospital:', hospital);
	}, [isOpen, hospital]);

	if (!hospital) return null;

	const handleWebsiteClick = () => {
		if (hospital.website) {
			window.open(hospital.website, '_blank', 'noopener,noreferrer');
		}
	};

	const handleGetDirections = () => {
		const encodedAddress = encodeURIComponent(hospital.address);
		window.open(
			`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
			'_blank',
			'noopener,noreferrer'
		);
	};

	return (
		<Dialog isOpen={isOpen} onClose={onClose}>
			<div className={styles.imageSection}>
				<div className={styles.mainImageContainer}>
					<Image
						src={hospital.image}
						alt={hospital.title}
						width={180}
						height={200}
						className={styles.mainImage}
					/>
				</div>

				{hospital.additionalImages && hospital.additionalImages.length > 0 && (
					<div className={styles.additionalImages}>
						{hospital.additionalImages.map((img, index) => (
							<div key={index} className={styles.additionalImageContainer}>
								<Image
									src={img}
									alt={`${hospital.title} ${index + 2}`}
									width={65}
									height={75}
									className={styles.additionalImage}
								/>
							</div>
						))}
					</div>
				)}
			</div>
			<div className={styles.headerSection}>
				<h2 className={styles.hospitalName}>{hospital.title}</h2>
				<div className={styles.rating}>
					<Star size={12} className={styles.starIcon} />
					<span className={styles.ratingText}>{hospital.rating}</span>
				</div>
			</div>

			<div className={styles.actionButtons}>
				<button onClick={handleWebsiteClick} className={styles.actionButton}>
					<Globe size={18} />
					{hospitalModalText.actionButtons.website}
				</button>
				<button onClick={handleGetDirections} className={styles.actionButton}>
					<MapPin size={18} />
					{hospitalModalText.actionButtons.directions}
				</button>
				<button className={styles.actionButton}>
					<Star size={18} />
					{hospitalModalText.actionButtons.reviews}
				</button>
			</div>

			<div className={styles.detailsSection}>
				<div className={styles.detailLabel}>
					<MapPin size={20} className={styles.detailIcon} />
					{hospitalModalText.detailLabels.address}{' '}
					<p className={styles.detailText}>{hospital.address}</p>
				</div>
				<div className={styles.detailLabel}>
					<Phone size={20} className={styles.detailIcon} />
					{hospitalModalText.detailLabels.getThere}{' '}
					<p className={styles.detailText}>{hospital.phone}</p>
				</div>
				<div className={styles.detailLabel}>
					<Clock size={20} className={styles.detailIcon} />
					{hospitalModalText.detailLabels.hours}{' '}
					<p className={styles.hours}>{hospital.hours}</p>
				</div>
			</div>
		</Dialog>
	);
};

export default HospitalModal;
