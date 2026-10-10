import dynamic from 'next/dynamic';
import { ComponentProps, ComponentType } from 'react';
import { InView } from 'react-intersection-observer';

// Default loading component using your color palette
const DefaultLoading = () => (
	<div
		style={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			padding: '2rem',
			backgroundColor: 'var(--subtleCardBackground)',
			borderRadius: 'var(--border-radii)',
			color: 'var(--lightText)',
			fontFamily: 'var(--default-font-family)',
			minHeight: '200px',
		}}
	>
		Loading...
	</div>
);

// HOC that wraps any component with intersection observer and dynamic import
export function withLazyLoad<T extends ComponentType<any>>(
	componentImport: () => Promise<{ default: T }>,
	options: {
		loadingComponent?: ComponentType;
		ssr?: boolean;
		threshold?: number;
		rootMargin?: string;
		triggerOnce?: boolean;
	} = {}
) {
	const {
		loadingComponent: LoadingComponent = DefaultLoading,
		ssr = false,
		threshold = 0.1,
		rootMargin = '50px',
		triggerOnce = true,
	} = options;

	// Create the dynamically imported component
	const LazyComponent = dynamic(componentImport, {
		loading: () => <LoadingComponent />,
		ssr,
	});

	// Return the HOC
	return function LazyLoadedComponent(props: ComponentProps<T>) {
		return (
			<InView threshold={threshold} rootMargin={rootMargin} triggerOnce={triggerOnce}>
				{({ inView, ref }) => {
					 return inView ? <LazyComponent ref={ref} {...props} /> :<div ref={ref}><LoadingComponent /></div>
					 				}}
			</InView>
		);
	};
}

// Alternative: Component version for more flexibility
interface LazyLoadProps {
	component: () => Promise<{ default: ComponentType<any> }>;
	componentProps?: Record<string, any>;
	loadingComponent?: ComponentType;
	ssr?: boolean;
	threshold?: number;
	rootMargin?: string;
	triggerOnce?: boolean;
}

export const LazyLoadComponent: React.FC<LazyLoadProps> = ({
	component,
	componentProps = {},
	loadingComponent: LoadingComponent = DefaultLoading,
	ssr = false,
	threshold = 0.1,
	rootMargin = '50px',
	triggerOnce = true,
}) => {
	const LazyComponent = dynamic(component, {
		loading: () => <LoadingComponent />,
		ssr,
	});

	return (
		<InView threshold={threshold} rootMargin={rootMargin} triggerOnce={triggerOnce}>
			{({ inView, ref }) => {
				if (inView) {
					return <LazyComponent ref={ref} {...componentProps} />;
				} else {
					return <div ref={ref}><LoadingComponent /></div>;
				}
			}}
		</InView>
	);
};

// Hook version for custom implementations
import { useInView } from 'react-intersection-observer';

export function useLazyLoad(
	component: () => Promise<{ default: ComponentType<any> }>,
	options: {
		loadingComponent?: ComponentType;
		ssr?: boolean;
		threshold?: number;
		rootMargin?: string;
		triggerOnce?: boolean;
	} = {}
) {
	const {
		loadingComponent: LoadingComponent = DefaultLoading,
		ssr = false,
		threshold = 0.1,
		rootMargin = '50px',
		triggerOnce = true,
	} = options;

	const { ref, inView } = useInView({
		threshold,
		rootMargin,
		triggerOnce,
	});

	const LazyComponent = dynamic(component, {
		loading: () => <LoadingComponent />,
		ssr,
	});

	return {
		ref,
		inView,
		LazyComponent,
	};
}
