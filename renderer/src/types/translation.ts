import { LucideIcon } from 'lucide-react';

export interface BlinkRateDataPoint {
	v: number;
}

export interface EyeStrainDataPoint {
	v: number;
	high: boolean;
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

export interface ProductCardData {
	key: string;
	title: string;
	description: string;
	image: string;
	amazonUrl: string;
	detailedDescription: string;
}

export interface MockReport {
	date: string;
	confidenceAverage: number;
	condition: string;
	percentage: number;
	emoji?: LucideIcon;
}

export interface MockReportBrief {
	date: string;
	confidenceAverage: number;
	condition: string;
}

export interface UserData {
	name: string;
	email: string;
	image: string;
}

export interface ReportHistoryItem {
	date: string;
	time: string;
	result: string;
	status: string;
	action: string;
}

export interface BusinessFeature {
	title: string;
	description: string;
}

export interface FeatureData extends BusinessFeature {
	icon: LucideIcon;
}

export interface WorkStep {
	number: string;
	title: string;
	description: string;
}

export interface NavItem {
	title: string;
	url: string;
}

export interface TranslationData {
	blinkRateData: BlinkRateDataPoint[];
	eyeStrainData: EyeStrainDataPoint[];
	eyeAgeData: BlinkRateDataPoint[];
	screenTimeData: BlinkRateDataPoint[];
	articlesData: ArticleCardData[];
	ExerciseData: ExerciseCardData[];
	hospitalsData: HospitalData[];
	productsData: ProductCardData[];
	userData: UserData;
	reportHistory: ReportHistoryItem[];
	problemPoints: string[];
	impactPoints: string[];
	businessFeatures: BusinessFeature[];
	beforeRescueEyes: string[];
	afterRescueEyes: string[];
	benefitsOrganisationData: BusinessFeature[];
	featureDataWithoutIcons: BusinessFeature[];
	whoWeWorkWithDataWithoutIcons: BusinessFeature[];
	mockReport: MockReport;
	mockReportBrief: MockReportBrief;
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
		steps: WorkStep[];
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
	registerFormText: {
		title: string;
		subtitle: string;
		nameLabel: string;
		namePlaceholder: string;
		emailLabel: string;
		emailPlaceholder: string;
		passwordLabel: string;
		passwordPlaceholder: string;
		confirmPasswordLabel: string;
		confirmPasswordPlaceholder: string;
		termsCheckboxText: string;
		termsLinkText: string;
		andText: string;
		privacyLinkText: string;
		loadingButtonText: string;
		submitButtonText: string;
		signInLinkText: string;
		signInText: string;
		validationErrors: {
			allFieldsRequired: string;
			passwordMinLength: string;
			passwordMismatch: string;
			invalidEmail: string;
			termsRequired: string;
		};
		firebaseErrors: {
			emailInUse: string;
			weakPassword: string;
			invalidEmail: string;
			operationNotAllowed: string;
			networkError: string;
			configurationError: string;
			defaultError: string;
		};
		successMessage: string;
	};
	loginFormText: {
		title: string;
		subtitle: string;
		emailLabel: string;
		emailPlaceholder: string;
		passwordLabel: string;
		passwordPlaceholder: string;
		forgotPasswordText: string;
		signInButton: string;
		loadingButtonText: string;
		successMessage: string;
		createAccountText: string;
		createAccountLink: string;
		resetTitle: string;
		resetSubtitle: string;
		sendResetButton: string;
		resetLoadingText: string;
		backToLoginButton: string;
		resetSuccessTitle: string;
		resetSuccessMessage: string;
		validationErrors: {
			emptyFields: string;
			invalidEmail: string;
		};
		firebaseErrors: {
			userNotFound: string;
			wrongPassword: string;
			invalidCredentials: string;
			invalidEmailFormat: string;
			accountDisabled: string;
			tooManyAttempts: string;
			networkError: string;
			configurationError: string;
			defaultError: string;
		};
		resetErrors: {
			emptyEmail: string;
			invalidEmail: string;
			userNotFound: string;
			resetFailed: string;
		};
		errorTitles: {
			accountNotFound: string;
			incorrectPassword: string;
			invalidCredentials: string;
			invalidEmail: string;
			invalidEmailFormat: string;
			accountDisabled: string;
			tooManyAttempts: string;
			networkError: string;
			missingInfo: string;
			loginError: string;
			emailRequired: string;
			resetFailed: string;
			success: string;
		};
		actionLinks: {
			createNewAccount: string;
			resetPassword: string;
			tryAgain: string;
		};
	};
	sidebarText: {
		logoText: string;
		navItems: NavItem[];
	};
	dashboardPageText: {
		errorMessage: string;
		retryButton: string;
		eyeScanReportTitle: string;
		articlesTitle: string;
	};
	reportHistoryText: {
		timeFilters: {
			today: string;
			week: string;
			month: string;
			year: string;
		};
		viewModes: {
			chartView: string;
			tableView: string;
			chart: string;
			table: string;
		};
		actions: {
			quickView: string;
			viewReport: string;
		};
		statusLabels: {
			normal: string;
			blinkRate: string;
			eyeStrain: string;
		};
		statusTypes: {
			blinkRate: string;
			eyeStrain: string;
		};
		tooltipUnits: {
			blinks: string;
			percentage: string;
			level: string;
		};
		chartTitles: {
			blinkRate: string;
			eyeClosure: string;
			attention: string;
			strainLevel: string;
		};
		tableHeaders: {
			date: string;
			results: string;
			actions: string;
		};
		emptyState: {
			noHistory: string;
			selectedDate: string;
			startTracking: string;
		};
	};
	eyeMetricsDisplayText: {
		metricLabels: {
			blinkRate: string;
			eyeClosure: string;
			eyeStrain: string;
			tiredness: string;
			attentionLevel: string;
			eyeAge: string;
			faceAge: string;
			eyeAspectRatio: string;
			pupilDilation: string;
			squintIntensity: string;
		};
		recommendedValues: {
			blinkRate: string;
			eyeClosure: string;
			eyeStrain: string;
			tiredness: string;
			attentionLevel: string;
			eyeAge: string;
			faceAge: string;
			eyeAspectRatio: string;
			pupilDilation: string;
			squintIntensity: string;
		};
		units: {
			years: string;
		};
	};
	eyeMetricsStreamText: {
		title: string;
		liveIndicator: string;
		currentMetrics: string;
		metricLabels: {
			blinkRate: string;
			eyeClosure: string;
			strainLevel: string;
			attention: string;
		};
		units: {
			bpm: string;
			close: string;
			strain: string;
		};
		attentionStates: {
			good: string;
			poor: string;
		};
		placeholder: string;
	};
	camScreenText: {
		loadingStates: {
			startingTracking: string;
			initializingCamera: string;
		};
		retryButton: string;
	};
	reportCardText: {
		title: string;
		subtitle: string;
		conditions: {
			high: string;
			moderate: string;
			normal: string;
		};
		statsFooter: string;
	};
	modalViewText: {
		metricCards: {
			blinkRate: {
				title: string;
				unit: string;
			};
			eyeClosure: {
				title: string;
				unit: string;
			};
			attentionLevel: {
				title: string;
				unit: string;
			};
			strainLevel: {
				title: string;
				unit: string;
			};
			tirednessLevel: {
				title: string;
				unit: string;
			};
			eyeAspectRatio: {
				title: string;
				unit: string;
			};
		};
	};
	metricCardsText: {
		defaultStatus: string;
		highUsage: string;
		tooltipSuffixes: {
			blinksPerMin: string;
			percentage: string;
			level: string;
		};
		strainLevels: string[];
	};
	navbarText: {
		searchPlaceholder: string;
		userMenuItems: {
			profile: string;
			settings: string;
			logout: string;
		};
		userMenuLabel: string;
		profileAlt: string;
		dropdownItems: Array<{
			label: string;
			href?: string;
		}>;
	};
	historyPageText: {
		title: string;
		subtitle: string;
		viewingData: string;
		today: string;
		eyeCareReport: string;
		monthlyReport: string;
		annualReport: string;
		monthlyDate: string;
		annualDate: string;
		allRecordsSecure: string;
		exportAllData: string;
	};
	reportPageText: {
		reportNotFound: string;
		reportNotFoundDesc: string;
		backToHistory: string;
		eyeScanReport: string;
		overallStatus: string;
		statusLabels: {
			normal: string;
			blinkRate: string;
			eyeStrain: string;
		};
		metricLabels: {
			blinkRate: string;
			eyeStrainLevel: string;
			tirednessLevel: string;
			attentionLevel: string;
			eyeAge: string;
			perclose: string;
		};
		normalRanges: {
			blinkRate: string;
			perclose: string;
		};
		units: {
			blinksPerMin: string;
			years: string;
			percentage: string;
		};
	};
	historyReportText: {
		title: string;
		filters: {
			scanTypePlaceholder: string;
		};
		tableHeaders: {
			date: string;
			results: string;
			actions: string;
		};
		statusLabels: {
			normal: string;
			blinkRate: string;
			eyeStrain: string;
		};
		statusTypes: {
			blinkRate: string;
			eyeStrain: string;
		};
		actions: {
			quickView: string;
			viewReport: string;
		};
		emptyState: {
			noHistory: string;
			startTracking: string;
		};
	};
	icarePageText: {
		sectionTitles: {
			eyeExercises: string;
			eyeProducts: string;
			eyeSpecialists: string;
		};
	};
	exerciseModalText: {
		comparisonTitle: string;
		metricLabels: {
			blinkRate: string;
			eyeClosure: string;
			strainLevel: string;
			attention: string;
		};
		attentionStates: {
			good: string;
			poor: string;
		};
		units: {
			bpm: string;
		};
		buttons: {
			markComplete: string;
			restart: string;
		};
	};
	hospitalModalText: {
		actionButtons: {
			website: string;
			directions: string;
			reviews: string;
		};
		detailLabels: {
			address: string;
			getThere: string;
			hours: string;
		};
	};
	productModalText: {
		aboutProduct: string;
		buyNow: string;
	};
	livePageText: {
		errorRetry: string;
		metricNames: {
			blinkRate: string;
			eyeStrain: string;
			eyeAge: string;
			screenTime: string;
		};
		units: {
			perMin: string;
			level: string;
			years: string;
		};
	};
	profilePageText: {
		sectionTitles: {
			recentEyeScan: string;
			scanHistory: string;
			personalisedAdvice: string;
		};
		recentScan: {
			title: string;
			confidenceLabel: string;
			viewFullReport: string;
		};
		scanHistory: {
			title: string;
			description: string;
		};
		profileCard: {
			ctaButton: string;
		};
	};
	settingsPageText: {
		sectionTitles: {
			accountSettings: string;
			aiScanSettings: string;
			discoveryPreferences: string;
			notification: string;
			privacyData: string;
			helpSupport: string;
		};
		accountSettings: {
			profileInfo: string;
			changePassword: string;
		};
		discoveryPreferences: {
			specialistRegion: string;
			productCategories: string;
		};
		aiScanSettings: {
			autoSaveScanHistory: string;
			autoShareScans: string;
			predictionSensitivity: string;
		};
		notifications: {
			healthScanReport: string;
			newProductArticles: string;
		};
		privacyData: {
			appPermission: string;
			downloadMyData: string;
			deleteMyData: string;
		};
		helpSupport: {
			faq: string;
			contactUs: string;
			termsPrivacy: string;
		};
		logOut: string;
	};
}
