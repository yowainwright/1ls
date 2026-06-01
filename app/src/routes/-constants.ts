import { FEATURES_CONSTANTS } from "@/components/Features/constants";
import { INSIGHTS_CONSTANTS } from "@/components/Insights/constants";
import { EXAMPLES_CAROUSEL_CONSTANTS } from "@/components/ExamplesCarousel/constants";
import { TOOLTIP_DEMO_CONSTANTS } from "@/components/TooltipDemo/constants";
import { NAVBAR_CONSTANTS } from "@/components/Navbar/constants";
import { siteConfig } from "@/lib/config";

export const HOME_PAGE = {
  navbar: NAVBAR_CONSTANTS,
  features: FEATURES_CONSTANTS,
  tooltipDemo: TOOLTIP_DEMO_CONSTANTS,
  examples: EXAMPLES_CAROUSEL_CONSTANTS,
  insights: INSIGHTS_CONSTANTS,
};

export const APP_CONSTANTS = {
  site: siteConfig,
  pages: {
    home: HOME_PAGE,
  },
};
