import { ArticleCardData, ExerciseCardData, ProductCardData } from '@/types';
import {
	BrainCircuit,
	ChartColumnIncreasing,
	Headset,
	House,
	Laptop,
	Laugh,
	Luggage,
	View,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export const useTranslatedData = () => {
	const t = useTranslations();
	const locale = useLocale();

	// Raw data from translations
	const articlesData: ArticleCardData[] = t.raw('data.articles');
	const ExerciseData: ExerciseCardData[] = t.raw('data.exercises');
	const hospitalsData = t.raw('data.hospitals');
	const productsData: ProductCardData[] = t.raw('data.products');

	const pathnames = {
		'/': t.raw('pathnames./'),
	};

	const userData = t.raw('data.userData');

	const reportHistory = t.raw('data.reportHistory');
	const problemPoints = t.raw('data.problemPoints');
	const impactPoints = t.raw('data.impactPoints');
	const businessFeatures = t.raw('data.businessFeatures');
	const beforeRescueEyes = t.raw('data.beforeRescueEyes');
	const afterRescueEyes = t.raw('data.afterRescueEyes');
	const benefitsOrganisationData = t.raw('data.benefitsOrganisation');

	// Text content
	const headerText = {
		logoText: t('header.logoText'),
		signInButton: t('header.signInButton'),
		getStartedButton: t('header.getStartedButton'),
	};

	const heroText = {
		heading: t('hero.heading'),
		highlight: t('hero.highlight'),
		subheading: t('hero.subheading'),
		getStartedButton: t('hero.getStartedButton'),
		learnMoreButton: t('hero.learnMoreButton'),
		imageAlt: t('hero.imageAlt'),
	};

	const workCardText = {
		headerTitle: t('homepage.workCard.headerTitle'),
		steps: [
			{
				number: t('homepage.workCard.steps.0.number'),
				title: t('homepage.workCard.steps.0.title'),
				description: t('homepage.workCard.steps.0.description'),
			},
			{
				number: t('homepage.workCard.steps.1.number'),
				title: t('homepage.workCard.steps.1.title'),
				description: t('homepage.workCard.steps.1.description'),
			},
			{
				number: t('homepage.workCard.steps.2.number'),
				title: t('homepage.workCard.steps.2.title'),
				description: t('homepage.workCard.steps.2.description'),
			},
		],
		buttonText: t('homepage.workCard.buttonText'),
	};

	const homePageText = {
		whyEyeHealthSection: {
			title: t('homepage.sections.whyEyeHealthSection.title'),
			imageAlt: t('homepage.sections.whyEyeHealthSection.imageAlt'),
			problemSubheading: t('homepage.sections.whyEyeHealthSection.problemSubheading'),
			impactSubheading: t('homepage.sections.whyEyeHealthSection.impactSubheading'),
		},
		featuresSection: {
			title: t('homepage.sections.featuresSection.title'),
		},
		organizationBenefitsSection: {
			title: t('homepage.sections.organizationBenefitsSection.title'),
		},
		builtForBusinessSection: {
			title: t('homepage.sections.builtForBusinessSection.title'),
			imageAlt: t('homepage.sections.builtForBusinessSection.imageAlt'),
		},
		whoWeWorkWithSection: {
			title: t('homepage.sections.whoWeWorkWithSection.title'),
		},
		corporateWellnessSection: {
			title: t('homepage.sections.corporateWellnessSection.title'),
			beforeSubheading: t('homepage.sections.corporateWellnessSection.beforeSubheading'),
			afterSubheading: t('homepage.sections.corporateWellnessSection.afterSubheading'),
		},
	};

	const footerText = {
		copyright: t('footer.copyright'),
		termsText: t('footer.termsText'),
		privacyText: t('footer.privacyText'),
		cookiesText: t('footer.cookiesText'),
	};

	const registerFormText = {
		title: t('auth.register.title'),
		subtitle: t('auth.register.subtitle'),
		nameLabel: t('auth.register.nameLabel'),
		namePlaceholder: t('auth.register.namePlaceholder'),
		emailLabel: t('auth.register.emailLabel'),
		emailPlaceholder: t('auth.register.emailPlaceholder'),
		passwordLabel: t('auth.register.passwordLabel'),
		passwordPlaceholder: t('auth.register.passwordPlaceholder'),
		confirmPasswordLabel: t('auth.register.confirmPasswordLabel'),
		confirmPasswordPlaceholder: t('auth.register.confirmPasswordPlaceholder'),
		termsCheckboxText: t('auth.register.termsCheckboxText'),
		termsLinkText: t('auth.register.termsLinkText'),
		andText: t('auth.register.andText'),
		privacyLinkText: t('auth.register.privacyLinkText'),
		loadingButtonText: t('auth.register.loadingButtonText'),
		submitButtonText: t('auth.register.submitButtonText'),
		signInLinkText: t('auth.register.signInLinkText'),
		signInText: t('auth.register.signInText'),
		successMessage: t('auth.register.successMessage'),
		socialDividerText: t('auth.register.socialDividerText'),
		continueWithApple: t('auth.register.continueWithApple'),
		validationErrors: {
			allFieldsRequired: t('auth.register.validationErrors.allFieldsRequired'),
			passwordMinLength: t('auth.register.validationErrors.passwordMinLength'),
			passwordMismatch: t('auth.register.validationErrors.passwordMismatch'),
			invalidEmail: t('auth.register.validationErrors.invalidEmail'),
			termsRequired: t('auth.register.validationErrors.termsRequired'),
		},
		firebaseErrors: {
			emailInUse: t('auth.register.firebaseErrors.emailInUse'),
			weakPassword: t('auth.register.firebaseErrors.weakPassword'),
			invalidEmail: t('auth.register.firebaseErrors.invalidEmail'),
			operationNotAllowed: t('auth.register.firebaseErrors.operationNotAllowed'),
			networkError: t('auth.register.firebaseErrors.networkError'),
			configurationError: t('auth.register.firebaseErrors.configurationError'),
			defaultError: t('auth.register.firebaseErrors.defaultError'),
		},
	};

	const loginFormText = {
		title: t('auth.login.title'),
		subtitle: t('auth.login.subtitle'),
		emailLabel: t('auth.login.emailLabel'),
		emailPlaceholder: t('auth.login.emailPlaceholder'),
		passwordLabel: t('auth.login.passwordLabel'),
		passwordPlaceholder: t('auth.login.passwordPlaceholder'),
		forgotPasswordText: t('auth.login.forgotPasswordText'),
		signInButton: t('auth.login.signInButton'),
		loadingButtonText: t('auth.login.loadingButtonText'),
		successMessage: t('auth.login.successMessage'),
		createAccountText: t('auth.login.createAccountText'),
		createAccountLink: t('auth.login.createAccountLink'),
		resetTitle: t('auth.login.resetTitle'),
		resetSubtitle: t('auth.login.resetSubtitle'),
		sendResetButton: t('auth.login.sendResetButton'),
		resetLoadingText: t('auth.login.resetLoadingText'),
		backToLoginButton: t('auth.login.backToLoginButton'),
		resetSuccessTitle: t('auth.login.resetSuccessTitle'),
		resetSuccessMessage: t('auth.login.resetSuccessMessage'),
		socialDividerText: t('auth.login.socialDividerText'),
		continueWithApple: t('auth.login.continueWithApple'),
		validationErrors: {
			emptyFields: t('auth.login.validationErrors.emptyFields'),
			invalidEmail: t('auth.login.validationErrors.invalidEmail'),
		},
		firebaseErrors: {
			userNotFound: t('auth.login.firebaseErrors.userNotFound'),
			wrongPassword: t('auth.login.firebaseErrors.wrongPassword'),
			invalidCredentials: t('auth.login.firebaseErrors.invalidCredentials'),
			invalidEmailFormat: t('auth.login.firebaseErrors.invalidEmailFormat'),
			accountDisabled: t('auth.login.firebaseErrors.accountDisabled'),
			tooManyAttempts: t('auth.login.firebaseErrors.tooManyAttempts'),
			networkError: t('auth.login.firebaseErrors.networkError'),
			configurationError: t('auth.login.firebaseErrors.configurationError'),
			defaultError: t('auth.login.firebaseErrors.defaultError'),
		},
	};

	const sidebarText = {
		logoText: t('navigation.sidebar.logoText'),
		navItems: [
			{
				title: t('navigation.sidebar.dashboard'),
				url: '/dashboard',
			},
			{
				title: t('navigation.sidebar.liveFeed'),
				url: '/live',
			},
			{
				title: t('navigation.sidebar.icare'),
				url: '/icare',
			},
			{
				title: t('navigation.sidebar.history'),
				url: '/history',
			},
			{
				title: t('navigation.sidebar.settings'),
				url: '/settings',
			},
		],
	};

	const navbarText = {
		searchPlaceholder: t('navigation.navbar.searchPlaceholder'),
		userMenuItems: {
			profile: t('navigation.navbar.profile'),
			settings: t('navigation.navbar.settings'),
			logout: t('navigation.navbar.logout'),
		},
		userMenuLabel: t('navigation.navbar.userMenuLabel'),
		profileAlt: t('navigation.navbar.profileAlt'),
		dropdownItems: [
			{
				label: t('navigation.navbar.profile'),
				href: '/profile',
			},
			{
				label: t('navigation.navbar.settings'),
				href: '/settings',
			},
			{
				label: t('navigation.navbar.logout'),
			},
		],
	};

	const dashboardPageText = {
		errorMessage: t('dashboard.errorMessage'),
		retryButton: t('dashboard.retryButton'),
		eyeScanReportTitle: t('dashboard.eyeScanReportTitle'),
		articlesTitle: t('dashboard.articlesTitle'),
	};

	const reportHistoryText = {
		timeFilters: {
			today: t('history.timeFilters.today'),
			week: t('history.timeFilters.week'),
			month: t('history.timeFilters.month'),
			year: t('history.timeFilters.year'),
		},
		viewModes: {
			chartView: t('history.viewModes.chartView'),
			tableView: t('history.viewModes.tableView'),
			chart: t('history.viewModes.chart'),
			table: t('history.viewModes.table'),
		},
		actions: {
			quickView: t('history.actions.quickView'),
			viewReport: t('history.actions.viewReport'),
		},
		statusLabels: {
			normal: t('reports.statusLabels.normal'),
			blinkRate: t('reports.statusLabels.blinkRate'),
			eyeStrain: t('reports.statusLabels.eyeStrain'),
		},
		statusTypes: {
			blinkRate: t('reports.statusTypes.blinkRate'),
			eyeStrain: t('reports.statusTypes.eyeStrain'),
		},
		tooltipUnits: {
			blinks: t('units.blinksPerMin'),
			percentage: t('units.percentage'),
			level: t('units.level'),
		},
		chartTitles: {
			blinkRate: t('history.chartTitles.blinkRate'),
			eyeClosure: t('history.chartTitles.eyeClosure'),
			attention: t('history.chartTitles.attention'),
			strainLevel: t('history.chartTitles.strainLevel'),
			eyeAge: t('eyeMetrics.labels.eyeAge'),
		},
		tableHeaders: {
			date: t('history.tableHeaders.date'),
			results: t('history.tableHeaders.results'),
			actions: t('history.tableHeaders.actions'),
		},
		emptyState: {
			noHistory: t('history.emptyState.noHistory'),
			selectedDate: t('history.emptyState.selectedDate'),
			startTracking: t('history.emptyState.startTracking'),
		},
		lastUpdate: t('history.lastUpdate'),
	};

	const eyeMetricsDisplayText = {
		metricLabels: {
			blinkRate: t('eyeMetrics.labels.blinkRate'),
			eyeClosure: t('eyeMetrics.labels.eyeClosure'),
			eyeStrain: t('eyeMetrics.labels.eyeStrain'),
			tiredness: t('eyeMetrics.labels.tiredness'),
			attentionLevel: t('eyeMetrics.labels.attentionLevel'),
			eyeAge: t('eyeMetrics.labels.eyeAge'),
			faceAge: t('eyeMetrics.labels.faceAge'),
			eyeAspectRatio: t('eyeMetrics.labels.eyeAspectRatio'),
			pupilDilation: t('eyeMetrics.labels.pupilDilation'),
			squintIntensity: t('eyeMetrics.labels.squintIntensity'),
		},
		recommendedValues: {
			blinkRate: t('eyeMetrics.recommendedValues.blinkRate'),
			eyeClosure: t('eyeMetrics.recommendedValues.eyeClosure'),
			eyeStrain: t('eyeMetrics.recommendedValues.eyeStrain'),
			tiredness: t('eyeMetrics.recommendedValues.tiredness'),
			attentionLevel: t('eyeMetrics.recommendedValues.attentionLevel'),
			eyeAge: t('eyeMetrics.recommendedValues.eyeAge'),
			faceAge: t('eyeMetrics.recommendedValues.faceAge'),
			eyeAspectRatio: t('eyeMetrics.recommendedValues.eyeAspectRatio'),
			pupilDilation: t('eyeMetrics.recommendedValues.pupilDilation'),
			squintIntensity: t('eyeMetrics.recommendedValues.squintIntensity'),
		},
		units: {
			years: t('units.years'),
		},
	};

	const eyeMetricsStreamText = {
		title: t('eyeMetrics.stream.title'),
		liveIndicator: t('eyeMetrics.stream.liveIndicator'),
		currentMetrics: t('eyeMetrics.stream.currentMetrics'),
		metricLabels: {
			blinkRate: t('eyeMetrics.labels.blinkRate'),
			eyeClosure: t('eyeMetrics.labels.eyeClosure'),
			strainLevel: t('eyeMetrics.labels.strainLevel'),
			attention: t('eyeMetrics.labels.attention'),
		},
		units: {
			bpm: t('units.bpm'),
			close: t('units.close'),
			strain: t('units.strain'),
		},
		attentionStates: {
			good: t('eyeMetrics.attentionStates.good'),
			poor: t('eyeMetrics.attentionStates.poor'),
		},
		placeholder: t('eyeMetrics.stream.placeholder'),
	};

	const camScreenText = {
		loadingStates: {
			startingTracking: t('live.loadingStates.startingTracking'),
			initializingCamera: t('live.loadingStates.initializingCamera'),
		},
		retryButton: t('common.retry'),
	};

	const reportCardText = {
		title: t('reports.card.title'),
		subtitle: t('reports.card.subtitle'),
		conditions: {
			high: t('reports.conditions.high'),
			moderate: t('reports.conditions.moderate'),
			normal: t('reports.conditions.normal'),
		},
		statsFooter: t('reports.card.statsFooter'),
	};

	const modalViewText = {
		metricCards: {
			blinkRate: {
				title: t('eyeMetrics.labels.blinkRate'),
				unit: t('units.blinksPerMin'),
			},
			eyeClosure: {
				title: t('eyeMetrics.labels.eyeClosure'),
				unit: 'closure percentage',
			},
			attentionLevel: {
				title: t('eyeMetrics.labels.attentionLevel'),
				unit: 'attention score',
			},
			strainLevel: {
				title: t('eyeMetrics.labels.strainLevel'),
				unit: 'strain intensity',
			},
			tirednessLevel: {
				title: t('eyeMetrics.labels.tiredness'),
				unit: 'fatigue level',
			},
			eyeAspectRatio: {
				title: t('eyeMetrics.labels.eyeAspectRatio'),
				unit: t('units.ratio'),
			},
		},
	};

	const metricCardsText = {
		defaultStatus: t('reports.statusLabels.normal'),
		highUsage: t('highUsage.title'),
		tooltipSuffixes: {
			blinksPerMin: ' ' + t('units.blinksPerMin'),
			percentage: t('units.percentage'),
			level: ' ' + t('units.level'),
		},
		strainLevels: [
			t('eyeMetrics.strainLevels.low'),
			t('eyeMetrics.strainLevels.moderate'),
			t('eyeMetrics.strainLevels.high'),
		],
	};

	const historyPageText = {
		title: t('history.title'),
		subtitle: t('history.subtitle'),
		viewingData: t('history.viewingData'),
		today: t('history.timeFilters.today'),
		eyeCareReport: t('history.eyeCareReport'),
		monthlyReport: t('history.monthlyReport'),
		annualReport: t('history.annualReport'),
		monthlyDate: 'April 16',
		annualDate: 'January 15',
		allRecordsSecure: t('history.allRecordsSecure'),
		exportAllData: t('history.exportAllData'),
	};

	const reportPageText = {
		reportNotFound: t('reports.page.reportNotFound'),
		reportNotFoundDesc: t('reports.page.reportNotFoundDesc'),
		backToHistory: t('reports.page.backToHistory'),
		eyeScanReport: t('reports.page.eyeScanReport'),
		overallStatus: t('reports.page.overallStatus'),
		statusLabels: {
			normal: t('reports.statusLabels.normal'),
			blinkRate: t('reports.statusLabels.blinkRate'),
			eyeStrain: t('reports.statusLabels.eyeStrain'),
		},
		metricLabels: {
			blinkRate: t('eyeMetrics.labels.blinkRate'),
			eyeStrainLevel: t('eyeMetrics.labels.eyeStrain'),
			tirednessLevel: t('eyeMetrics.labels.tiredness'),
			attentionLevel: t('eyeMetrics.labels.attentionLevel'),
			eyeAge: t('eyeMetrics.labels.eyeAge'),
			perclose: t('reports.normalRanges.perclose'),
		},
		normalRanges: {
			blinkRate: t('reports.normalRanges.blinkRate'),
			perclose: t('reports.normalRanges.perclose'),
		},
		units: {
			blinksPerMin: ' ' + t('units.blinksPerMin'),
			years: ' ' + t('units.years'),
			percentage: t('units.percentage'),
		},
	};

	const historyReportText = {
		title: 'Eye Scan Report History',
		filters: {
			scanTypePlaceholder: 'Scan type',
		},
		tableHeaders: {
			date: t('history.tableHeaders.date'),
			results: t('history.tableHeaders.results'),
			actions: t('history.tableHeaders.actions'),
		},
		statusLabels: {
			normal: t('reports.statusLabels.normal'),
			blinkRate: t('reports.statusLabels.blinkRate'),
			eyeStrain: t('reports.statusLabels.eyeStrain'),
		},
		statusTypes: {
			blinkRate: t('reports.statusTypes.blinkRate'),
			eyeStrain: t('reports.statusTypes.eyeStrain'),
		},
		actions: {
			quickView: t('history.actions.quickView'),
			viewReport: t('history.actions.viewReport'),
		},
		emptyState: {
			noHistory: t('history.emptyState.noHistory'),
			startTracking: t('history.emptyState.startTracking'),
		},
	};

	const icarePageText = {
		sectionTitles: {
			eyeExercises: t('icare.sectionTitles.eyeExercises'),
			eyeProducts: t('icare.sectionTitles.eyeProducts'),
			eyeSpecialists: t('icare.sectionTitles.eyeSpecialists'),
		},
	};

	const exerciseModalText = {
		comparisonTitle: t('icare.exerciseModal.comparisonTitle'),
		metricLabels: {
			blinkRate: t('eyeMetrics.labels.blinkRate'),
			eyeClosure: t('eyeMetrics.labels.eyeClosure'),
			strainLevel: t('eyeMetrics.labels.strainLevel'),
			attention: t('eyeMetrics.labels.attention'),
		},
		attentionStates: {
			good: t('eyeMetrics.attentionStates.good'),
			poor: t('eyeMetrics.attentionStates.poor'),
		},
		units: {
			bpm: ' ' + t('units.bpm'),
		},
		buttons: {
			markComplete: t('icare.exerciseModal.buttons.markComplete'),
			restart: t('icare.exerciseModal.buttons.restart'),
		},
	};

	const hospitalModalText = {
		actionButtons: {
			website: t('icare.hospitalModal.actionButtons.website'),
			directions: t('icare.hospitalModal.actionButtons.directions'),
			reviews: t('icare.hospitalModal.actionButtons.reviews'),
		},
		detailLabels: {
			address: t('icare.hospitalModal.detailLabels.address'),
			getThere: t('icare.hospitalModal.detailLabels.getThere'),
			hours: t('icare.hospitalModal.detailLabels.hours'),
		},
	};

	const productModalText = {
		aboutProduct: t('icare.productModal.aboutProduct'),
		buyNow: t('icare.productModal.buyNow'),
	};

	const livePageText = {
		errorRetry: t('live.errorRetry'),
		metricNames: {
			blinkRate: t('eyeMetrics.labels.blinkRate'),
			eyeStrain: t('eyeMetrics.labels.eyeStrain'),
			eyeAge: t('eyeMetrics.labels.eyeAge'),
			screenTime: t('common.screenTime'),
		},
		units: {
			perMin: t('units.blinksPerMin'),
			level: t('units.level'),
			years: t('units.years'),
		},
	};

	const profilePageText = {
		sectionTitles: {
			recentEyeScan: t('profile.sectionTitles.recentEyeScan'),
			scanHistory: t('profile.sectionTitles.scanHistory'),
			personalisedAdvice: t('profile.sectionTitles.personalisedAdvice'),
		},
		recentScan: {
			title: t('profile.recentScan.title'),
			confidenceLabel: t('profile.recentScan.confidenceLabel'),
			viewFullReport: t('profile.recentScan.viewFullReport'),
		},
		scanHistory: {
			title: t('profile.scanHistory.title'),
			description: t('profile.scanHistory.description'),
		},
		profileCard: {
			ctaButton: t('profile.profileCard.ctaButton'),
		},
	};

	const settingsPageText = {
		sectionTitles: {
			accountSettings: t('settings.sectionTitles.accountSettings'),
			aiScanSettings: t('settings.sectionTitles.aiScanSettings'),
			discoveryPreferences: t('settings.sectionTitles.discoveryPreferences'),
			notification: t('settings.sectionTitles.notification'),
			privacyData: t('settings.sectionTitles.privacyData'),
			helpSupport: t('settings.sectionTitles.helpSupport'),
		},
		accountSettings: {
			profileInfo: t('settings.accountSettings.profileInfo'),
			changePassword: t('settings.accountSettings.changePassword'),
		},
		discoveryPreferences: {
			specialistRegion: t('settings.discoveryPreferences.specialistRegion'),
			productCategories: t('settings.discoveryPreferences.productCategories'),
		},
		aiScanSettings: {
			autoSaveScanHistory: t('settings.aiScanSettings.autoSaveScanHistory'),
			autoShareScans: t('settings.aiScanSettings.autoShareScans'),
			predictionSensitivity: t('settings.aiScanSettings.predictionSensitivity'),
		},
		notifications: {
			healthScanReport: t('settings.notifications.healthScanReport'),
			newProductArticles: t('settings.notifications.newProductArticles'),
		},
		privacyData: {
			appPermission: t('settings.privacyData.appPermission'),
			downloadMyData: t('settings.privacyData.downloadMyData'),
			deleteMyData: t('settings.privacyData.deleteMyData'),
		},
		helpSupport: {
			faq: t('settings.helpSupport.faq'),
			contactUs: t('settings.helpSupport.contactUs'),
			termsPrivacy: t('settings.helpSupport.termsPrivacy'),
		},
		logOut: t('settings.logOut'),
	};

	// Mock reports with data from translations
	const mockReport = {
		...t.raw('data.mockReport'),
		emoji: Laugh,
	};

	const mockReportBrief = t.raw('data.mockReportBrief');

	// Feature data with icons
	const featureData = [
		{
			icon: House,
			...t.raw('data.features')[0],
		},
		{
			icon: BrainCircuit,
			...t.raw('data.features')[1],
		},
		{
			icon: View,
			...t.raw('data.features')[2],
		},
		{
			icon: ChartColumnIncreasing,
			...t.raw('data.features')[3],
		},
	];

	// Who we work with data with icons
	const whoWeWorkWithData = [
		{
			icon: House,
			...t.raw('data.whoWeWorkWith')[0],
		},
		{
			icon: Headset,
			...t.raw('data.whoWeWorkWith')[1],
		},
		{
			icon: Luggage,
			...t.raw('data.whoWeWorkWith')[2],
		},
		{
			icon: Laptop,
			...t.raw('data.whoWeWorkWith')[3],
		},
	];

	return {
		// Raw data arrays
		articlesData,
		ExerciseData,
		hospitalsData,
		productsData,
		userData,
		reportHistory,
		problemPoints,
		impactPoints,
		businessFeatures,
		beforeRescueEyes,
		afterRescueEyes,
		benefitsOrganisationData,

		// Text objects
		headerText,
		heroText,
		workCardText,
		homePageText,
		footerText,
		registerFormText,
		loginFormText,
		sidebarText,
		navbarText,
		dashboardPageText,
		reportHistoryText,
		eyeMetricsDisplayText,
		eyeMetricsStreamText,
		camScreenText,
		reportCardText,
		modalViewText,
		metricCardsText,
		historyPageText,
		reportPageText,
		historyReportText,
		icarePageText,
		exerciseModalText,
		hospitalModalText,
		productModalText,
		livePageText,
		profilePageText,
		settingsPageText,

		// Mock reports
		mockReport,
		mockReportBrief,

		// Data with icons
		featureData,
		whoWeWorkWithData,
		pathnames,
	};
};

export default useTranslatedData;
