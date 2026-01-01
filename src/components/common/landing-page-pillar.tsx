import type React from "react";
import { twMerge } from "tailwind-merge";

const border = "border-neutral-500"; //border-gray-300
export default function LandingPageContentHolder({ children }: { children: React.ReactNode }) {
	return (
		<main className={twMerge("grow flex items-stretch border-y border-dashed", border)}>
			<LandingPagePillar className="border-r" />
			<section className="grow p-4">{children}</section>
			<LandingPagePillar className="border-l" />
		</main>
	);
}
export const LandingPagePillar = ({ className }: { className?: string }) => {
	return <aside className={twMerge("w-4 sm:w-5 lg:w-12 border-dashed", border, className)}></aside>;
};
