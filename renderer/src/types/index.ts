import { LucideIcon } from 'lucide-react';
import { ComponentType } from 'react';

export interface RegisterRequestBody {
	name: string;
	email: string;
	password: string;
}

export interface MetricsCardData {
	name: string;
	value: string | number;
	unit?: string;
	icon?: React.ReactNode;
	graphData: {
		v: number;
		high?: boolean;
	}[];
	className?: string;
	status?: string;
}
export interface ArticleCardData {
	title: string;
	description: string;
	image: string;
}

export interface ProductCardData {
	key: string;
	title: string;
	description: string;
	image: string;
	price?: string;
	amazonUrl?: string;
	detailedDescription?: string;
}
export interface HospitalCardData {
	description: string;
	title: string;
	image: string;
	address: string;
	phone: string;
	website: string;
	hours: string;
	rating: string;
	additionalImages?: string[];
}

export interface ExerciseCardData {
	title: string;
	image: string;
	youtubeUrl: string;
	description?: string;
}

export interface RecentScanProps {
	report: {
		confidenceAverage: number;
		condition: string;
		date: string;
	};
	chartData: {
		v: number;
		high?: boolean;
	}[];
}

export interface ProfileCardProps {
	name: string;
	email: string;
	image: string;
}

type Feature = {
	icon?: ComponentType<{ className?: string }>;
	title: string;
	description: string;
};

export type FeatureCardsProps = {
	features: Feature[];
};

export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	footer?: React.ReactNode;
}

export interface ArticleCardData {
	title: string;
	description: string;
	image: string;
}

export interface ExerciseCardData {
	title: string;
	image: string;
	youtubeUrl: string;
	description: string;
}

export interface ProductCardData {
	key: string;
	title: string;
	description: string;
	image: string;
	amazonUrl: string;
	detailedDescription: string;
}

export interface HospitalData {
	title: string;
	description: string;
	image: string;
	address: string;
	phone: string;
	website: string;
	hours: string;
	rating: string;
	additionalImages: string[];
}

export interface ReportHistoryItem {
	date: string;
	time: string;
	result: string;
	status: string;
	action: string;
}

export interface UserData {
	name: string;
	email: string;
	image: string;
}

export interface MockReport {
	date: string;
	confidenceAverage: number;
	condition: string;
	percentage: number;
	emoji?: LucideIcon;
}

export interface FeatureData {
	icon: LucideIcon;
	title: string;
	description: string;
}

export interface LanguageData {
	blinkRateData: Array<{ v: number }>;
	eyeStrainData: Array<{ v: number; high: boolean }>;
	eyeAgeData: Array<{ v: number }>;
	screenTimeData: Array<{ v: number }>;
	articlesData: ArticleCardData[];
	ExerciseData: ExerciseCardData[];
	hospitalsData: HospitalData[];
	productsData: ProductCardData[];
	mockReport: Omit<MockReport, 'emoji'>;
	mockReportBrief: Omit<MockReport, 'emoji' | 'percentage'>;
	userData: UserData;
	reportHistory: ReportHistoryItem[];
	problemPoints: string[];
	impactPoints: string[];
	businessFeatures: Array<{ title: string; description: string }>;
	beforeRescueEyes: string[];
	afterRescueEyes: string[];
	benefitsOrganisationData: Array<{ title: string; description: string }>;
	headerText: {
		logoText: string;
		signInButton: string;
		getStartedButton: string;
	};
	heroText: {
		heading: string;
		highlight: string;
		subheading: string;
		getStartedButton: string;
		learnMoreButton: string;
		imageAlt: string;
	};
	workCardText: {
		headerTitle: string;
		steps: Array<{
			number: string;
			title: string;
			description: string;
		}>;
		buttonText: string;
	};
	homePageText: {
		whyEyeHealthSection: {
			title: string;
			imageAlt: string;
			problemSubheading: string;
			impactSubheading: string;
		};
		featuresSection: {
			title: string;
		};
		organizationBenefitsSection: {
			title: string;
		};
		builtForBusinessSection: {
			title: string;
			imageAlt: string;
		};
		whoWeWorkWithSection: {
			title: string;
		};
		corporateWellnessSection: {
			title: string;
			beforeSubheading: string;
			afterSubheading: string;
		};
	};
	footerText: {
		copyright: string;
		termsText: string;
		privacyText: string;
		cookiesText: string;
	};
	registerFormText: any;
	loginFormText: any;
	sidebarText: any;
	navbarText: any;
	dashboardPageText: any;
	reportHistoryText: any;
	eyeMetricsDisplayText: any;
	eyeMetricsStreamText: any;
	camScreenText: any;
	reportCardText: any;
	modalViewText: any;
	metricCardsText: any;
	historyPageText: any;
	reportPageText: any;
	historyReportText: any;
	icarePageText: any;
	exerciseModalText: any;
	hospitalModalText: any;
	productModalText: any;
	livePageText: any;
	profilePageText: any;
	settingsPageText: any;
	featureDataWithoutIcons: Array<{ title: string; description: string }>;
	whoWeWorkWithDataWithoutIcons: Array<{ title: string; description: string }>;
}
