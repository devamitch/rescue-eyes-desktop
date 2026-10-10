'use client';

import { auth } from '@/constants/firebase';
import useTranslationData from '@/hooks/use-translation-data';
import { Link, useRouter } from '@/i18n/navigation';
import useAppStore from '@/store';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import styles from './LoginForm.module.css';
import { Apple, ChevronLeft, Eye, EyeOff, X } from 'lucide-react';


export default function LoginForm() {
	const { loginFormText, camScreenText } = useTranslationData();

	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});
	const [error, setError] = useState({ type: '', message: '' });
	const [isLoading, setIsLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');
	const [showResetForm, setShowResetForm] = useState(false);
	const [resetEmail, setResetEmail] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const router = useRouter();
	const { startScreenTime } = useAppStore((state) => state?.screenTime);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Clear error when user starts typing
		if (error.type) setError({ type: '', message: '' });
	};

	const clearField = (fieldName: string) => {
		setFormData((prev) => ({
			...prev,
			[fieldName]: '',
		}));
	};

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	const validateForm = () => {
		if (!formData.email || !formData.password) {
			setError({
				type: 'empty_fields',
				message: loginFormText.validationErrors.emptyFields,
			});
			return false;
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			setError({
				type: 'invalid_email',
				message: loginFormText.validationErrors.invalidEmail,
			});
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError({ type: '', message: '' });
		setSuccessMessage('');

		if (!validateForm()) return;

		setIsLoading(true);

		try {
			await signInWithEmailAndPassword(auth, formData.email, formData.password);
			setSuccessMessage(loginFormText.successMessage);
			try {
				startScreenTime?.();
			} catch (e) {
				console.log('Error starting screen time:', e);
			}

			// Redirect to dashboard after successful login
			setTimeout(() => {
				router.push('/dashboard');
			}, 1500);
		} catch (err: any) {
			console.error('Login error:', err);

			switch (err.code) {
				case 'auth/user-not-found':
					setError({
						type: 'user_not_found',
						message: loginFormText.firebaseErrors.userNotFound,
					});
					break;
				case 'auth/wrong-password':
					setError({
						type: 'wrong_password',
						message: loginFormText.firebaseErrors.wrongPassword,
					});
					break;
				case 'auth/invalid-credential':
					setError({
						type: 'invalid_credentials',
						message: loginFormText.firebaseErrors.invalidCredentials,
					});
					break;
				case 'auth/invalid-email':
					setError({
						type: 'invalid_email_format',
						message: loginFormText.firebaseErrors.invalidEmailFormat,
					});
					break;
				case 'auth/user-disabled':
					setError({
						type: 'account_disabled',
						message: loginFormText.firebaseErrors.accountDisabled,
					});
					break;
				case 'auth/too-many-requests':
					setError({
						type: 'too_many_attempts',
						message: loginFormText.firebaseErrors.tooManyAttempts,
					});
					break;
				case 'auth/network-request-failed':
					setError({
						type: 'network_error',
						message: loginFormText.firebaseErrors.networkError,
					});
					break;
				case 'auth/configuration-not-found':
					setError({
						type: 'firebase_config',
						message: loginFormText.firebaseErrors.configurationError,
					});
					break;
				default:
					setError({
						type: 'unknown_error',
						message: err?.message || loginFormText.firebaseErrors.defaultError,
					});
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handlePasswordReset = async (e: React.FormEvent) => {
		e.preventDefault();
		setError({ type: '', message: '' });

		if (!resetEmail) {
			setError({
				type: 'reset_empty_email',
				message: loginFormText.validationErrors.emptyFields,
			});
			return;
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
			setError({
				type: 'reset_invalid_email',
				message: loginFormText.validationErrors.invalidEmail,
			});
			return;
		}

		setIsLoading(true);

		try {
			await sendPasswordResetEmail(auth, resetEmail);
			setSuccessMessage(loginFormText.resetSuccessMessage);
			setShowResetForm(false);
			setResetEmail('');
		} catch (err: any) {
			console.error('Password reset error:', err);

			if (err.code === 'auth/user-not-found') {
				setError({
					type: 'reset_user_not_found',
					message: loginFormText.firebaseErrors.userNotFound,
				});
			} else {
				setError({
					type: 'reset_failed',
					message: camScreenText.retryButton,
				});
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className={styles.container}>
		<div  className={styles.header}>
			<ChevronLeft 
				size={36} 
				className={styles.chevron} 
				onClick={() => router.back()}
				style={{ cursor: 'pointer' }}
			/>
			<h2 className={styles.title}>{loginFormText.signInButton}</h2>
			<div className={styles.placeholder}/>
		</div>
			<div className={styles.formWrapper}>
				<div className={styles.welcomeHeader}>
					<h2 className={styles.WelcomeTitle}>{loginFormText.title}</h2>
					<p className={styles.subtitle}>{loginFormText.subtitle}</p>
						</div>

				{!showResetForm ? (
					<form onSubmit={handleSubmit} className={styles.form}>
						<div className={styles.inputGroup}>
							<label htmlFor="email" className={styles.label}>
								{loginFormText.emailLabel}
							</label>
							<div className={styles.inputWrapper}>
								<input
									id="email"
									name="email"
									type="email"
									value={formData.email}
									onChange={handleChange}
									placeholder={loginFormText.emailPlaceholder}
									required
									className={`${styles.input} ${error.type.includes('email') ? styles.inputError : ''}`}
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
							{error.type.includes('email') && (
								<div className={styles.fieldErrorIndicator}>
									<span>⚠️</span>
								</div>
							)}
						</div>

						<div className={styles.inputGroup}>
							<label htmlFor="password" className={styles.label}>
								{loginFormText.passwordLabel}
							</label>
							<div className={styles.inputWrapper}>
								<input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									value={formData.password}
									onChange={handleChange}
									placeholder={loginFormText.passwordPlaceholder}
									required
									className={`${styles.input} ${error.type.includes('password') ? styles.inputError : ''}`}
									disabled={isLoading}
								/>
								<button
									type="button"
									className={styles.inputIcon}
									onClick={togglePasswordVisibility}
									disabled={isLoading}
								>
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
							{error.type.includes('password') && (
								<div className={styles.fieldErrorIndicator}>
									<span>⚠️</span>
								</div>
							)}
						</div>

						<div className={styles.forgotPassword}>
							<button
								type="button"
								onClick={() => setShowResetForm(true)}
								className={styles.forgotLink}
								disabled={isLoading}
							>
								{loginFormText.forgotPasswordText}
							</button>
						</div>

						<button
							type="submit"
							className={`${styles.button} ${isLoading ? styles.buttonLoading : ''}`}
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<span className={styles.spinner}></span>
									{loginFormText.loadingButtonText}
								</>
							) : (
								loginFormText.signInButton
							)}
						</button>

					<div className={styles.socialDivider}>
						<div className={styles.dividerLine}></div>
						<span className={styles.dividerText}>{loginFormText.socialDividerText}</span>
						<div className={styles.dividerLine}></div>
					</div>							<button
								className={styles.socialButton}
								disabled={isLoading}
								onClick={() => {
									// Implement Apple login
									console.log('Apple login clicked');
								}}
							>
								<Apple size={20} color="var(--metricValue)" fill='var(--metricValue)' />
								{loginFormText.continueWithApple}
							</button>
  <div className={styles.linkContainer}>
						{loginFormText.createAccountText}{' '}
						<Link href="/register" className={styles.link}>
							{loginFormText.createAccountLink}
						</Link>
					</div>
						

						{error.message && (
							<div className={styles.error}>
								<div className={styles.errorContent}>
									<div className={styles.errorTitle}>
										{error.type === 'user_not_found' &&
											loginFormText.firebaseErrors.userNotFound}
										{error.type === 'wrong_password' &&
											loginFormText.firebaseErrors.wrongPassword}
										{error.type === 'invalid_credentials' &&
											loginFormText.firebaseErrors.invalidCredentials}
										{error.type === 'invalid_email' &&
											loginFormText.firebaseErrors.invalidEmailFormat}
										{error.type === 'invalid_email_format' &&
											loginFormText.firebaseErrors.invalidEmailFormat}
										{error.type === 'account_disabled' &&
											loginFormText.firebaseErrors.accountDisabled}
										{error.type === 'too_many_attempts' &&
											loginFormText.firebaseErrors.tooManyAttempts}
										{error.type === 'network_error' &&
											loginFormText.firebaseErrors.networkError}
										{error.type === 'empty_fields' &&
											loginFormText.validationErrors.emptyFields}
										{![
											'user_not_found',
											'wrong_password',
											'invalid_credentials',
											'invalid_email',
											'invalid_email_format',
											'account_disabled',
											'too_many_attempts',
											'network_error',
											'empty_fields',
										].includes(error.type) &&
											loginFormText.firebaseErrors.configurationError}
									</div>
								</div>
							</div>
						)}

						{successMessage && (
							<div className={styles.success}>
								<div className={styles.successContent}>
									<div className={styles.successTitle}>{successMessage}</div>
								</div>
							</div>
						)}

						{/* <div className={styles.linkContainer}>
							{loginFormText.createAccountText}{' '}
							<Link href="/register" className={styles.link}>
								{loginFormText.createAccountLink}
							</Link>
						</div> */}
					</form>
				) : (
					<form onSubmit={handlePasswordReset} className={styles.form}>
						<h2 className={styles.resetTitle}>{loginFormText.resetTitle}</h2>
						<p className={styles.resetSubtitle}>{loginFormText.resetSubtitle}</p>

						<div className={styles.inputGroup}>
							<label htmlFor="resetEmail" className={styles.label}>
								{loginFormText.emailLabel}
							</label>
							<input
								id="resetEmail"
								name="resetEmail"
								type="email"
								value={resetEmail}
								onChange={(e) => setResetEmail(e.target.value)}
								placeholder={loginFormText.emailPlaceholder}
								required
								className={`${styles.input} ${error.type.includes('reset') ? styles.inputError : ''}`}
								disabled={isLoading}
							/>
							{error.type.includes('reset') && (
								<div className={styles.fieldErrorIndicator}>
									<span>⚠️</span>
								</div>
							)}
						</div>

						<div className={styles.resetActions}>
							<button
								type="submit"
								className={`${styles.button} ${isLoading ? styles.buttonLoading : ''}`}
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<span className={styles.spinner}></span>
										{loginFormText.resetLoadingText}
									</>
								) : (
									loginFormText.sendResetButton
								)}
							</button>

							<button
								type="button"
								onClick={() => {
									setShowResetForm(false);
									setError({ type: '', message: '' });
								}}
								className={styles.secondaryButton}
								disabled={isLoading}
							>
								{loginFormText.backToLoginButton}
							</button>
						</div>

						{/* {error.message && error.type.includes('reset') && (
							<div className={styles.error}>
								<div className={styles.errorIcon}>⚠️</div>
								<div className={styles.errorContent}>
									<div className={styles.errorTitle}>
										{error.type === 'reset_user_not_found' &&
											loginFormText.firebaseErrors.userNotFound}
										{error.type === 'reset_empty_email' &&
											loginFormText.errorTitles.emailRequired}
										{error.type === 'reset_invalid_email' &&
											loginFormText.errorTitles.invalidEmail}
										{error.type === 'reset_failed' &&
											loginFormText.errorTitles.resetFailed}
									</div>
									<div className={styles.errorMessage}>{error.message}</div>
								</div>
							</div>
						)} */}

						{successMessage && (
							<div className={styles.success}>
								<div className={styles.successIcon}>✅</div>
								<div className={styles.successContent}>
									<div className={styles.successTitle}>
										{loginFormText.resetSuccessTitle}
									</div>
									<div className={styles.successMessage}>{successMessage}</div>
								</div>
							</div>
						)}
					</form>
				)}
			</div>
		</div>
	);
}
