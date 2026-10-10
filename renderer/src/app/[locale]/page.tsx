'use client';
import FeatureCards from '@/components/landingPage/FeatureCards/FeatureCards';
import Header from '@/components/landingPage/Header/Header';
import Hero from '@/components/landingPage/Hero/Hero';
import WorkCard from '@/components/landingPage/WorkCard/WorkCard';
import Footer from '@/components/layout/Footer/Footer';

import useTranslationData from '@/hooks/use-translation-data';
import Image from 'next/image';
import styles from './Home.module.css';

export default function Home() {
	const {
		afterRescueEyes,
		beforeRescueEyes,
		benefitsOrganisationData,
		businessFeatures,
		featureData,
		homePageText,
		impactPoints,
		problemPoints,
		whoWeWorkWithData,
	} = useTranslationData();

	return (
		<div className={styles.container}>
			<Header />
						<main className={styles.mainContent}>

				<Hero />
				{/*  Why Eye Health Matters */}
				<section className={styles.featuresSection}>
					<div className={styles.twoColumnLayout}>
						<Image
							src="/hero3.svg"
							alt={homePageText.whyEyeHealthSection.imageAlt}
							width={500}
							height={500}
							className={styles.layoutImage}
						/>
						<div className={styles.layoutContent}>
							<h2 className={styles.sectionTitle}>
								{homePageText.whyEyeHealthSection.title}
							</h2>
							<div className={styles.infoCard}>
								<h3 className={styles.subHeading}>
									{homePageText.whyEyeHealthSection.problemSubheading}
								</h3>
								<ul className={styles.checkList}>
									{problemPoints.map((point, index) => (
										<li key={index} className={styles.checkListItem}>
											{point}
										</li>
									))}
								</ul>
							</div>
							<div className={styles.infoCard}>
								<h3 className={styles.subHeading}>
									{homePageText.whyEyeHealthSection.impactSubheading}
								</h3>
								<ul className={styles.checkList}>
									{impactPoints.map((point, index) => (
										<li key={index} className={styles.checkListItem}>
											{point}
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</section>

				{/*  What RescueEyess Does */}
				<section id="features" className={styles.featuresSection}>
					<h2 className={styles.sectionTitle}>{homePageText.featuresSection.title}</h2>
					<FeatureCards features={featureData} />
				</section>

				{/*  Benefits for Organizations */}
				<section id="organisation-benefits" className={styles.featuresSection}>
					<h2 className={styles.sectionTitle}>
						{homePageText.organizationBenefitsSection.title}
					</h2>
					<FeatureCards features={benefitsOrganisationData} />
				</section>

				{/*  Built for Business */}
				<section className={styles.featuresSection}>
					<h2 className={styles.sectionTitle}>
						{homePageText.builtForBusinessSection.title}
					</h2>
					<div className={styles.twoColumnLayout}>
						<Image
							src="/hero2.svg"
							alt={homePageText.builtForBusinessSection.imageAlt}
							width={500}
							height={500}
							className={styles.layoutImage}
						/>
						<div className={styles.buisnessContent}>
							{businessFeatures.map((feature, index) => (
								<div key={index}>
									<h3 className={styles.subHeading}>{feature.title}</h3>
									<p className={styles.sectionDescription}>
										{feature.description}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/*  Who We Work With */}
				<section id="who-we-work-with" className={styles.featuresSection}>
					<h2 className={styles.sectionTitle}>
						{homePageText.whoWeWorkWithSection.title}
					</h2>
					<FeatureCards features={whoWeWorkWithData} />
				</section>

				{/*  Corporate Wellness ROI */}
				<section className={styles.featuresSection}>
					<h2 className={styles.sectionTitle}>
						{homePageText.corporateWellnessSection.title}
					</h2>
					<div className={styles.twoColumnLayout}>
						<div className={styles.infoCard}>
							<h3 className={styles.subHeading}>
								{homePageText.corporateWellnessSection.beforeSubheading}
							</h3>
							<ul className={styles.checkList}>
								{beforeRescueEyes.map((point, index) => (
									<li key={index} className={styles.checkListItem}>
										{point}
									</li>
								))}
							</ul>
						</div>
						<div className={styles.infoCard}>
							<h3 className={styles.subHeading}>
								{homePageText.corporateWellnessSection.afterSubheading}
							</h3>
							<ul className={styles.checkList}>
								{afterRescueEyes.map((point, index) => (
									<li key={index} className={styles.checkListItem}>
										{point}
									</li>
								))}
							</ul>
						</div>
					</div>
				</section>

				{/*  How It Works */}
				<section id="trust-proof" className={styles.WorksSection}>
					<WorkCard />
				</section>
			</main>
			<Footer />
		</div>
	);
}
