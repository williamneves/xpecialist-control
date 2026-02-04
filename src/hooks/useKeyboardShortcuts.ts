import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { Doc } from "../../convex/_generated/dataModel";

type Draft = Doc<"drafts">;

interface UseKeyboardShortcutsProps {
	selectedDraft: Draft | null;
	onApprove: () => void;
	onRejectQuick: () => void;
	onRejectWithReason: () => void;
	onEdit: () => void;
	onNavigateNext: () => void;
	onNavigatePrev: () => void;
}

interface UseKeyboardShortcutsReturn {
	helpOpen: boolean;
	setHelpOpen: (open: boolean) => void;
	isArmed: boolean;
	isRejectArmed: boolean;
}

const ARMED_TIMEOUT_MS = 5000;

export function useKeyboardShortcuts({
	selectedDraft,
	onApprove,
	onRejectQuick,
	onRejectWithReason,
	onEdit,
	onNavigateNext,
	onNavigatePrev,
}: UseKeyboardShortcutsProps): UseKeyboardShortcutsReturn {
	const [helpOpen, setHelpOpen] = useState(false);
	const [isArmed, setIsArmed] = useState(false);
	const [isRejectArmed, setIsRejectArmed] = useState(false);

	// Refs for timeouts to allow cleanup
	const armedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const rejectArmedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	// Reset armed states when draft changes
	useEffect(() => {
		setIsArmed(false);
		setIsRejectArmed(false);

		// Clear any pending timeouts
		if (armedTimeoutRef.current) {
			clearTimeout(armedTimeoutRef.current);
			armedTimeoutRef.current = null;
		}
		if (rejectArmedTimeoutRef.current) {
			clearTimeout(rejectArmedTimeoutRef.current);
			rejectArmedTimeoutRef.current = null;
		}
	}, [selectedDraft?._id]);

	// Cleanup timeouts on unmount
	useEffect(() => {
		return () => {
			if (armedTimeoutRef.current) {
				clearTimeout(armedTimeoutRef.current);
			}
			if (rejectArmedTimeoutRef.current) {
				clearTimeout(rejectArmedTimeoutRef.current);
			}
		};
	}, []);

	// Alt+A: Double-tap approve pattern
	// First press arms, second confirms (within 5s timeout)
	useHotkeys(
		"alt+a",
		() => {
			if (isArmed) {
				// Second press - confirm approve
				if (armedTimeoutRef.current) {
					clearTimeout(armedTimeoutRef.current);
					armedTimeoutRef.current = null;
				}
				setIsArmed(false);
				onApprove();
			} else {
				// First press - arm
				setIsArmed(true);
				armedTimeoutRef.current = setTimeout(() => {
					setIsArmed(false);
					armedTimeoutRef.current = null;
				}, ARMED_TIMEOUT_MS);
			}
		},
		{
			enabled: selectedDraft?.status === "pending",
			preventDefault: true,
			enableOnFormTags: true, // Allow in dialogs with focused form elements
		},
		[selectedDraft?.status, isArmed, onApprove],
	);

	// Alt+R: Double-tap reject pattern
	// First press arms, second quick-rejects (within 5s timeout)
	useHotkeys(
		"alt+r",
		() => {
			if (isRejectArmed) {
				// Second press - quick reject with default reason
				if (rejectArmedTimeoutRef.current) {
					clearTimeout(rejectArmedTimeoutRef.current);
					rejectArmedTimeoutRef.current = null;
				}
				setIsRejectArmed(false);
				onRejectQuick();
			} else {
				// First press - arm
				setIsRejectArmed(true);
				rejectArmedTimeoutRef.current = setTimeout(() => {
					setIsRejectArmed(false);
					rejectArmedTimeoutRef.current = null;
				}, ARMED_TIMEOUT_MS);
			}
		},
		{
			enabled: selectedDraft?.status === "pending",
			preventDefault: true,
			enableOnFormTags: true, // Allow in dialogs with focused form elements
		},
		[selectedDraft?.status, isRejectArmed, onRejectQuick],
	);

	// Alt+Y: Reject with custom reason (only when reject-armed)
	useHotkeys(
		"alt+y",
		() => {
			if (rejectArmedTimeoutRef.current) {
				clearTimeout(rejectArmedTimeoutRef.current);
				rejectArmedTimeoutRef.current = null;
			}
			setIsRejectArmed(false);
			onRejectWithReason();
		},
		{
			enabled: selectedDraft?.status === "pending" && isRejectArmed,
			preventDefault: true,
			enableOnFormTags: true, // Allow in dialogs with focused form elements
		},
		[selectedDraft?.status, isRejectArmed, onRejectWithReason],
	);

	// Alt+E: Edit mode (single press, no confirmation)
	useHotkeys(
		"alt+e",
		() => {
			onEdit();
		},
		{
			enabled:
				selectedDraft !== null && selectedDraft.status !== "published",
			preventDefault: true,
			enableOnFormTags: true, // Allow in dialogs with focused form elements
		},
		[selectedDraft, onEdit],
	);

	// j: Navigate to next draft
	useHotkeys(
		"j",
		() => {
			onNavigateNext();
		},
		{
			enabled: selectedDraft !== null,
			preventDefault: true,
		},
		[selectedDraft, onNavigateNext],
	);

	// k: Navigate to previous draft
	useHotkeys(
		"k",
		() => {
			onNavigatePrev();
		},
		{
			enabled: selectedDraft !== null,
			preventDefault: true,
		},
		[selectedDraft, onNavigatePrev],
	);

	// shift+/ (? key): Open help overlay
	// Always enabled
	useHotkeys(
		"shift+/",
		() => {
			setHelpOpen(true);
		},
		{
			preventDefault: true,
		},
		[],
	);

	return {
		helpOpen,
		setHelpOpen,
		isArmed,
		isRejectArmed,
	};
}
