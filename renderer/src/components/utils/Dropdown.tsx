'use client';
import { Link } from '@/i18n/navigation';
import React, { useEffect, useRef, useState } from 'react';
import styles from './Dropdown.module.css';

type MenuItem = {
	label: string | React.ReactNode;
	icon?: React.ReactNode;
	href?: string;
	onSelect?: () => void;
	danger?: boolean;
};

type DropdownMenuProps = {
	trigger: React.ReactNode;
	header?: React.ReactNode;
	items: MenuItem[];
	align?: 'start' | 'center' | 'end';
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({
	trigger,
	header,
	items,
	align = 'center',
}) => {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const onDocClick = (e: MouseEvent) => {
			if (!rootRef.current?.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('mousedown', onDocClick);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDocClick);
			document.removeEventListener('keydown', onKey);
		};
	}, []);

	const contentAlignClass =
		align === 'start'
			? styles.alignStart
			: align === 'center'
				? styles.alignCenter
				: styles.alignEnd;

	return (
		<div className={styles.root} ref={rootRef}>
			<div
				className={styles.trigger}
				onClick={() => setOpen((v) => !v)}
				aria-haspopup="menu"
				aria-expanded={open}
			>
				{trigger}
			</div>

			{open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

			<div className={`${styles.content} ${contentAlignClass}`} role="menu" hidden={!open}>
				{header ? <div className={styles.header}>{header}</div> : null}

				{items.map((item, idx) => {
					const cls = `${styles.item} ${item.danger ? styles.danger : ''}`;
					if (item.href) {
						return (
							<Link
								key={`${item.label}-${idx}`}
								href={item.href}
								className={cls}
								onClick={() => setOpen(false)}
							>
								{item.icon ? <span>{item.icon}</span> : null}
								<span>{item.label}</span>
							</Link>
						);
					}
					return (
						<button
							key={`${item.label}-${idx}`}
							type="button"
							className={cls}
							role="menuitem"
							onClick={() => {
								item.onSelect?.();
								setOpen(false);
							}}
						>
							{item.icon ? <span>{item.icon}</span> : null}
							<span>{item.label}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default DropdownMenu;
