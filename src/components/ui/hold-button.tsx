import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HoldButtonProps
	extends React.ComponentProps<"button">,
		VariantProps<typeof buttonVariants> {
	onComplete: () => void;
	holdDuration?: number;
	children: React.ReactNode;
	asChild?: boolean;
}

export function HoldButton({
	onComplete,
	holdDuration = 500,
	children,
	className,
	disabled,
	...props
}: HoldButtonProps) {
	const [isHolding, setIsHolding] = React.useState(false);
	const [progress, setProgress] = React.useState(0);
	const timerRef = React.useRef<number | null>(null);
	const startTimeRef = React.useRef<number>(0);
	const rafRef = React.useRef<number | null>(null);

	const updateProgress = React.useCallback(() => {
		const elapsed = Date.now() - startTimeRef.current;
		const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
		setProgress(newProgress);

		if (newProgress < 100) {
			rafRef.current = requestAnimationFrame(updateProgress);
		}
	}, [holdDuration]);

	const startHold = React.useCallback(() => {
		if (disabled) return;

		setIsHolding(true);
		setProgress(0);
		startTimeRef.current = Date.now();

		// Start progress animation
		rafRef.current = requestAnimationFrame(updateProgress);

		// Set timer for completion
		timerRef.current = window.setTimeout(() => {
			setIsHolding(false);
			setProgress(0);
			onComplete();
		}, holdDuration);
	}, [disabled, holdDuration, onComplete, updateProgress]);

	const cancelHold = React.useCallback(() => {
		setIsHolding(false);
		setProgress(0);

		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		if (rafRef.current) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
	}, []);

	// Cleanup on unmount
	React.useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, []);

	// Handle keyboard events
	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.key === " " || e.key === "Enter") && !isHolding) {
				e.preventDefault();
				startHold();
			}
		},
		[isHolding, startHold],
	);

	const handleKeyUp = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === " " || e.key === "Enter") {
				e.preventDefault();
				cancelHold();
			}
		},
		[cancelHold],
	);

	return (
		<Button
			{...props}
			disabled={disabled}
			className={cn("relative overflow-hidden", className)}
			onMouseDown={startHold}
			onMouseUp={cancelHold}
			onMouseLeave={cancelHold}
			onTouchStart={startHold}
			onTouchEnd={cancelHold}
			onKeyDown={handleKeyDown}
			onKeyUp={handleKeyUp}
		>
			{/* Progress overlay */}
			{isHolding && (
				<div
					className="absolute inset-0 bg-white/20 transition-none"
					style={{
						width: `${progress}%`,
						left: 0,
					}}
				/>
			)}
			<span className="relative z-10">{children}</span>
		</Button>
	);
}
