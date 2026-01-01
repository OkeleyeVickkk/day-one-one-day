import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomSelectProps {
	label: string;
	description?: string;
	placeholder?: string;
	value?: string;
	onValueChange?: (value: string) => void;
	children: React.ReactNode;
	className?: string;
}

const CustomSelect = React.forwardRef<HTMLButtonElement, CustomSelectProps>(
	({ label, description, placeholder, value, onValueChange, children, className, ...props }, ref) => {
		const selectId = React.useId();

		return (
			<div className="space-y-2">
				<label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
					{label}
				</label>
				<Select value={value} onValueChange={onValueChange}>
					<SelectTrigger id={selectId} className={`w-full ${className || ""}`} ref={ref} {...props}>
						<SelectValue placeholder={placeholder} />
					</SelectTrigger>
					<SelectContent>{children}</SelectContent>
				</Select>
				{description && <p className="text-sm text-gray-500">{description}</p>}
			</div>
		);
	}
);

CustomSelect.displayName = "CustomSelect";

export { CustomSelect, SelectItem };
