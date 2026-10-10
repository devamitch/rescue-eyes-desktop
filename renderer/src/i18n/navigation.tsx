import { useLocale } from 'next-intl';
import { createNavigation } from 'next-intl/navigation';
import { LinkProps } from 'next/link';
import { routing } from './routing';

export const {
	Link: LinkX,
	redirect,
	usePathname,
	useRouter,
	getPathname,
} = createNavigation(routing);

export const Link: React.FC<
	LinkProps & { children?: React.ReactNode; className?: string; title?: string }
> = (props) => {
	const locale = useLocale();
	return <LinkX {...props} locale={locale} />;
};
