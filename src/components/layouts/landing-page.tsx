import { Outlet } from "react-router";
import LandingPageHeader from "../common/landing-page-header";
import LandingPageFooter from "../common/landing-page-footer";
import LandingPageContentHolder from "../common/landing-page-pillar";

export default function LandingPageLayout() {
	return (
		<div className="flex flex-col min-h-screen">
			<LandingPageHeader />
			<LandingPageContentHolder>
				<Outlet />
			</LandingPageContentHolder>
			<LandingPageFooter />
		</div>
	);
}
