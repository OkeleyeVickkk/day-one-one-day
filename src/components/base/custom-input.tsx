import * as React from "react";
import { Input } from "@/components/ui/input";

interface CustomInputProps extends React.ComponentProps<"input"> {
	label?: string;
	description?: string;
	hideLabel?: boolean;
	left?: React.ReactNode;
	right?: React.ReactNode;
}

const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
	({ label, description, hideLabel = false, id, className, left, right, ...props }, ref) => {
		const inputId = id || React.useId();
		const hasLeft = !!left;
		const hasRight = !!right;
		const paddingClass = `${hasLeft ? "pl-10" : ""} ${hasRight ? "pr-10" : ""}`.trim();

		return (
			<div className="space-y-2">
				{!hideLabel && label && (
					<label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
						{label}
					</label>
				)}
				<div className="relative">
					{left && <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{left}</div>}
					<Input id={inputId} className={`w-full ${paddingClass} ${className || ""}`} ref={ref} {...props} />
					{right && <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>}
				</div>
				{description && <p className="text-sm text-gray-500">{description}</p>}
			</div>
		);
	}
);

CustomInput.displayName = "CustomInput";

export { CustomInput };
export default CustomInput;
