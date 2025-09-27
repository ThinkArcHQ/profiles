import { cn } from "@/lib/utils";
import { 
  IconAdjustmentsBolt, 
  IconCloud, 
  IconCurrencyDollar, 
  IconEaseInOut, 
  IconHeart, 
  IconHelp, 
  IconRouteAltLeft, 
  IconTerminal2, 
} from "@tabler/icons-react";

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "Universal Access",
      description:
        "Anyone can join - students, hobbyists, experts, enthusiasts. Not limited to professionals.",
      icon: <IconTerminal2 />,
    },
    {
      title: "AI Discovery",
      description:
        "Intelligent systems find the right person for any need - cooking buddy, study partner, business mentor.",
      icon: <IconEaseInOut />,
    },
    {
      title: "Direct Value",
      description:
        "Receive meeting requests and quote opportunities directly from AI agents worldwide.",
      icon: <IconCurrencyDollar />,
    },
    {
      title: "Global Reach",
      description: "Your profile works 24/7 worldwide. Be discovered across different time zones.",
      icon: <IconCloud />,
    },
    {
      title: "Seamless Connections",
      description: "Effortless introductions and meeting coordination. AI handles the discovery process.",
      icon: <IconRouteAltLeft />,
    },
    {
      title: "Personal Branding",
      description:
        "Get your unique profile URL for easy sharing. Build your personal brand in the AI ecosystem.",
      icon: <IconHelp />,
    },
    {
      title: "Meeting Requests",
      description:
        "Connect with people who need your skills for meetings, consultations, and collaborations.",
      icon: <IconAdjustmentsBolt />,
    },
    {
      title: "Quote Opportunities",
      description: "Receive quote requests for your services and expertise from AI-powered matching.",
      icon: <IconHeart />,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-orange-200",
        (index === 0 || index === 4) && "lg:border-l border-orange-200",
        index < 4 && "lg:border-b border-orange-200"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-orange-50 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-orange-600">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-orange-300 group-hover/feature:bg-orange-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-orange-900">
          {title}
        </span>
      </div>
      <p className="text-sm text-orange-700 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};