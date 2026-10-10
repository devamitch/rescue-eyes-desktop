import useTranslationData from '@/hooks/use-translation-data';
import { Link } from '@/i18n/navigation';
import { ProfileCardProps } from '@/types';
import { Lock } from 'lucide-react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import styles from './ProfileCard.module.css';

function ProfileCard({ name, email, image }: ProfileCardProps) {
	const { profilePageText } = useTranslationData();
	const locale = useLocale();
	return (
		<div className={styles.container}>
			<div className={styles.profileContainer}>
				<Image
					src={image}
					alt="Profile Image"
					width={36}
					height={36}
					className={styles.avatar}
				/>
			<div className={styles.profileSection}>
					<h2 className={styles.title}>{name}</h2>
					<p className={styles.subtitle}>{email}</p>
					<Link href="/dashboard" className={styles.link} locale={locale}>
						{profilePageText.profileCard.ctaButton}
					</Link>
			</div>
			</div>
				
			<Lock className={styles.icon} size={20} />
		</div>
	);
}

export default ProfileCard;
