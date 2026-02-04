import { cn } from "@/lib/utils";

interface PageContainerProps {
	children: React.ReactNode;
	className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
	return (
		<div className={cn("container max-w-5xl mx-auto py-8 px-4", className)}>
			{children}
		</div>
	);
}
