'use client';

import { auth } from '@/constants/firebase';
import useTranslationData from '@/hooks/use-translation-data';
import { Link, useRouter } from '@/i18n/navigation';
import {
	createUserWithEmailAndPassword,
	sendEmailVerification,
	updateProfile,
} from 'firebase/auth';
import { useState } from 'react';
import styles from './RegisterForm.module.css';
import { ChevronLeft, Apple, Eye, EyeOff, X } from 'lucide-react';
// import { useRouter } from '@/i18n/navigation'
export default function RegisterForm() {
	const { registerFormText } = useTranslationData();

	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		acceptTerms: false,
	});
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const router = useRouter();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
	};

	const clearField = (fieldName: string) => {
		setFormData((prev) => ({
			...prev,
			[fieldName]: '',
		}));
	};

	const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
		if (field === 'password') {
			setShowPassword(!showPassword);
		} else {
			setShowConfirmPassword(!showConfirmPassword);
		}
	};

	const validateForm = () => {
		if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
			setError(registerFormText.validationErrors.allFieldsRequired);
			return false;
		}

		if (formData.password.length < 4) {
			setError(registerFormText.validationErrors.passwordMinLength);
			return false;
		}

		if (formData.password !== formData.confirmPassword) {
			setError(registerFormText.validationErrors.passwordMismatch);
			return false;
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			setError(registerFormText.validationErrors.invalidEmail);
			return false;
		}

		if (!formData.acceptTerms) {
			setError(registerFormText.validationErrors.termsRequired);
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError('');
		setSuccessMessage('');

		if (!validateForm()) return;

		setIsLoading(true);

		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				formData.email,
				formData.password
			);
			await updateProfile(userCredential.user, { displayName: formData.name });

			// Send email verification
			await sendEmailVerification(userCredential.user);

			setSuccessMessage(registerFormText.successMessage);

			// Clear form
			setFormData({
				name: '',
				email: '',
				password: '',
				confirmPassword: '',
				acceptTerms: false,
			});

			// Redirect after a short delay
			setTimeout(() => {
				router.push('/signin');
			}, 3000);
		} catch (err: any) {
			console.error('Registration error:', err);

			switch (err.code) {
				case 'auth/email-already-in-use':
					setError(registerFormText.firebaseErrors.emailInUse);
					break;
				case 'auth/weak-password':
					setError(registerFormText.firebaseErrors.weakPassword);
					break;
				case 'auth/invalid-email':
					setError(registerFormText.firebaseErrors.invalidEmail);
					break;
				case 'auth/operation-not-allowed':
					setError(registerFormText.firebaseErrors.operationNotAllowed);
					break;
				case 'auth/network-request-failed':
					setError(registerFormText.firebaseErrors.networkError);
					break;
				case 'auth/configuration-not-found':
					setError(registerFormText.firebaseErrors.configurationError);
					break;
				default:
					setError(registerFormText.firebaseErrors.defaultError);
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<ChevronLeft 
					size={36} 
					className={styles.chevron} 
					onClick={() => router.back()}
					style={{ cursor: 'pointer' }}
				/>
				<h2 className={styles.title}>{registerFormText.title}</h2>
				<div className={styles.placeholder} />
			</div>
			<div className={styles.formWrapper}>
				<div className={styles.welcomeHeader}>
					<h2 className={styles.welcomeTitle}>{registerFormText.title}</h2>
					<p className={styles.subtitle}>{registerFormText.subtitle}</p>
				</div>

				<form onSubmit={handleSubmit} className={styles.form}>
					<div className={styles.inputGroup}>
						<label htmlFor="name" className={styles.label}>
							{registerFormText.nameLabel}
						</label>
						<div className={styles.inputWrapper}>
							<input
								id="name"
								name="name"
								type="text"
								value={formData.name}
								onChange={handleChange}
								placeholder={registerFormText.namePlaceholder}
								required
								className={styles.input}
								disabled={isLoading}
							/>
							{formData.name && (
								<button
									type="button"
									className={styles.inputIcon}
									onClick={() => clearField('name')}
									disabled={isLoading}
								>
									<X size={16} />
								</button>
							)}
						</div>
					</div>

					<div className={styles.inputGroup}>
						<label htmlFor="email" className={styles.label}>
							{registerFormText.emailLabel}
						</label>
						<div className={styles.inputWrapper}>
							<input
								id="email"
								name="email"
								type="email"
								value={formData.email}
								onChange={handleChange}
								placeholder={registerFormText.emailPlaceholder}
								required
								className={styles.input}
								disabled={isLoading}
							/>
							{formData.email && (
								<button
									type="button"
									className={styles.inputIcon}
									onClick={() => clearField('email')}
									disabled={isLoading}
								>
									<X size={20} />
								</button>
							)}
						</div>
					</div>

					<div className={styles.inputGroup}>
						<label htmlFor="password" className={styles.label}>
							{registerFormText.passwordLabel}
						</label>
						<div className={styles.inputWrapper}>
							<input
								id="password"
								name="password"
								type={showPassword ? "text" : "password"}
								value={formData.password}
								onChange={handleChange}
								placeholder={registerFormText.passwordPlaceholder}
								required
								className={styles.input}
								disabled={isLoading}
							/>
							<button
								type="button"
								className={styles.inputIcon}
								onClick={() => togglePasswordVisibility('password')}
								disabled={isLoading}
							>
								{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
							</button>
						</div>
					</div>

					<div className={styles.inputGroup}>
						<label htmlFor="confirmPassword" className={styles.label}>
							{registerFormText.confirmPasswordLabel}
						</label>
						<div className={styles.inputWrapper}>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type={showConfirmPassword ? "text" : "password"}
								value={formData.confirmPassword}
								onChange={handleChange}
								placeholder={registerFormText.confirmPasswordPlaceholder}
								required
								className={styles.input}
								disabled={isLoading}
							/>
							<button
								type="button"
								className={styles.inputIcon}
								onClick={() => togglePasswordVisibility('confirmPassword')}
								disabled={isLoading}
							>
								{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
							</button>
						</div>
					</div>

					<div className={styles.checkboxGroup}>
						<input
							id="acceptTerms"
							name="acceptTerms"
							type="checkbox"
							checked={formData.acceptTerms}
							onChange={handleChange}
							className={styles.checkbox}
							disabled={isLoading}
						/>
						<label htmlFor="acceptTerms" className={styles.checkboxLabel}>
							{registerFormText.termsCheckboxText}{' '}
							<Link href="/terms" className={styles.link}>
								{registerFormText.termsLinkText}
							</Link>{' '}
							{registerFormText.andText}{' '}
							<Link href="/privacy" className={styles.link}>
								{registerFormText.privacyLinkText}
							</Link>
						</label>
					</div>

					{error && <div className={styles.error}>{error}</div>}

					{successMessage && <div className={styles.success}>{successMessage}</div>}
					<button
						type="submit"
						className={`${styles.button} ${isLoading ? styles.buttonLoading : ''}`}
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<span className={styles.spinner}></span>
								{registerFormText.loadingButtonText}
							</>
						) : (
							registerFormText.submitButtonText
						)}
					</button>
					<div className={styles.socialDivider}>
						<div className={styles.dividerLine}></div>
						<span className={styles.dividerText}>{registerFormText.socialDividerText}</span>
						<div className={styles.dividerLine}></div>
					</div>

					<button
						type="button"
						className={styles.socialButton}
						disabled={isLoading}
						onClick={() => {
							// Implement Apple login
							console.log('Apple signup clicked');
						}}
					>
						<Apple size={20} color="var(--metricValue)" fill="var(--metricValue)" />
						{registerFormText.continueWithApple}
					</button>
					    
				</form>
				<div className={styles.linkContainer}>
						{registerFormText.signInLinkText}{' '}
						<Link href="/signin" className={styles.link}>
							{registerFormText.signInText}
						</Link>
					</div>
			</div>
		</div>
	);
}
