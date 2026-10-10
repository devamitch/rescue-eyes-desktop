'use client';

interface CustomTooltipProps {
	active?: boolean;
	payload?: any[];
	label?: string;
	valueSuffix?: string;
	labelFormatter?: (payload: any) => string;
	valueFormatter?: (value: number) => string;
	chartType?: 'blink' | 'strain' | 'age' | 'screentime';
}

const CustomTooltip = ({
	active,
	payload,
	label,
	valueSuffix = '',
	labelFormatter,
	valueFormatter,
	chartType,
}: CustomTooltipProps) => {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		let tooltipLabel = '';
		let tooltipValue = payload[0].value;

		// Custom label formatting
		if (labelFormatter) {
			tooltipLabel = labelFormatter(data);
		} else if (data.hour !== undefined) {
			// Format hour for screen time data
			const hour = data.hour;
			const period = hour >= 12 ? 'PM' : 'AM';
			const displayHour = hour % 12 || 12;
			tooltipLabel = `${displayHour} ${period}`;
		} else if (data.timestamp) {
			// Format timestamp for time-based data
			tooltipLabel = new Date(data.timestamp).toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
			});
		} else {
			tooltipLabel = 'Current';
		}

		// Custom value formatting
		if (valueFormatter) {
			tooltipValue = valueFormatter(payload[0].value);
		}

		// Chart-specific styling
		const getChartColor = () => {
			switch (chartType) {
				case 'blink':
					return '#b86c25';
				case 'strain':
					return '#A74444';
				case 'age':
					return '#38bdf8';
				case 'screentime':
					return '#8b5cf6';
				default:
					return '#485953';
			}
		};

		return (
			<div
				className="custom-tooltip"
				style={{
					background: 'rgba(255, 255, 255, 0.40)',
					padding: '8px 12px',
				}}
			>
				<p className="tooltip-time">{tooltipLabel}</p>
				<p className="tooltip-value" style={{ color: getChartColor() }}>
					{tooltipValue}
					{valueSuffix}
				</p>
			</div>
		);
	}
	return null;
};

export default CustomTooltip;
