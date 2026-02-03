import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { addMinutes, isBefore } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/datetime-picker";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

type Draft = Doc<"drafts">;

interface ScheduleDialogProps {
	draft: Draft;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function validateScheduleTime(scheduledFor: Date): string | null {
	const minimumTime = addMinutes(new Date(), 5); // 5 minute buffer
	if (isBefore(scheduledFor, minimumTime)) {
		return "Agende para pelo menos 5 minutos no futuro";
	}
	return null;
}

function truncateContent(content: string, maxLength = 100): string {
	if (content.length <= maxLength) return content;
	return `${content.slice(0, maxLength)}...`;
}

export default function ScheduleDialog({
	draft,
	open,
	onOpenChange,
}: ScheduleDialogProps) {
	const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
		undefined,
	);
	const [error, setError] = useState<string | null>(null);

	const { mutate: scheduleDraft, isPending } = useMutation({
		mutationFn: useConvexMutation(api.drafts.schedule),
		onSuccess: () => {
			toast.success("Draft agendado!");
			setScheduledDate(undefined);
			setError(null);
			onOpenChange(false);
		},
		onError: (err) => {
			toast.error(`Erro ao agendar: ${err.message}`);
		},
	});

	const handleSchedule = () => {
		if (!scheduledDate) return;

		const validationError = validateScheduleTime(scheduledDate);
		if (validationError) {
			setError(validationError);
			return;
		}

		setError(null);
		scheduleDraft({
			id: draft._id,
			scheduledFor: scheduledDate.getTime(),
		});
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			// Reset state when closing
			setScheduledDate(undefined);
			setError(null);
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Agendar Draft</DialogTitle>
					<DialogDescription>
						{truncateContent(draft.content)}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<DateTimePicker
						value={scheduledDate}
						onChange={(date) => {
							setScheduledDate(date);
							setError(null);
						}}
						minDate={new Date()}
					/>

					{error && <p className="text-sm text-destructive">{error}</p>}
				</div>

				<DialogFooter>
					<Button variant="ghost" onClick={() => handleOpenChange(false)}>
						Cancelar
					</Button>
					<Button
						onClick={handleSchedule}
						disabled={isPending || !scheduledDate}
					>
						{isPending ? "Agendando..." : "Agendar"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
