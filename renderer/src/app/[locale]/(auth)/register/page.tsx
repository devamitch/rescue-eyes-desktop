import RegisterForm from "@/components/auth/RegisterForm/RegisterForm";
import useTranslationData from "@/hooks/use-translation-data";
import styles from './register.module.css';
import Image from "next/image";
import Link from "next/link";

export default function Register() {
  const { heroText } = useTranslationData();
   const { registerFormText } = useTranslationData();
  
  return <div className={styles.container} >
    <div className={styles.welcomeContainer}>
      <div className={styles.textContainer}>
       <p className={styles.heading}>
					{heroText.heading}{' '}
					<span className={styles.highlight}>{heroText.highlight}</span>
				</p>
        <p className={styles.heroSubtitle}>{heroText.subheading}</p>
       <div className={styles.linkContainer}>
						{registerFormText.signInLinkText}{' '}
						<Link href="/signin" className={styles.link}>
							{registerFormText.signInText}
						</Link>
					</div>
      </div>
      
      <Image
        src="/authpage.png"
        alt="Welcome"
        width={550}
        height={550}
        className={styles.image}
      />
    </div>
    <div className={styles.formContainer}>
      <RegisterForm />
    </div>
  </div>;
}