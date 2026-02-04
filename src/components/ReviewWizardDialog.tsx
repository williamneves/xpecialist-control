import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import {
	Calendar,
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { HoldButton } from "@/components/ui/hold-button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import ScheduleDialog from "./ScheduleDialog";

type Draft = Doc<"drafts">;

interface ReviewWizardDialogProps {
	drafts: Draft[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ReviewWizardDialog({
	drafts,
	open,
	onOpenChange,
}: ReviewWizardDialogProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [showRejectForm, setShowRejectForm] = useState(false);
	const [rejectionReason, setRejectionReason] = useState("");
	const [rejectionError, setRejectionError] = useState("");
	const [showScheduleDialog, setShowScheduleDialog] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Reset state when dialog opens
	const handleOpenChange = (newOpen: boolean) => {
		if (newOpen) {
			setCurrentIndex(0);
			setShowRejectForm(false);
			setRejectionReason("");
			setRejectionError("");
		}
		onOpenChange(newOpen);
	};

	const currentDraft = drafts[currentIndex];
	const isLast = currentIndex === drafts.length - 1;
	const isFirst = currentIndex === 0;

	const { mutate: approveDraft, isPending: isApproving } = useMutation({
		mutationFn: useConvexMutation(api.drafts.approve),
		onSuccess: () => {
			toast.success("Draft aprovado!");
			handleNext();
		},
		onError: (error) => toast.error(`Erro: ${error.message}`),
	});

	const { mutate: rejectDraft, isPending: isRejecting } = useMutation({
		mutationFn: useConvexMutation(api.drafts.reject),
		onSuccess: () => {
			toast.success("Draft rejeitado");
			setShowRejectForm(false);
			setRejectionReason("");
			handleNext();
		},
		onError: (error) => toast.error(`Erro: ${error.message}`),
	});

	const handleNext = () => {
		if (isLast) {
			toast.success("Todos os drafts pendentes foram revisados!");
			onOpenChange(false);
		} else {
			setCurrentIndex((i) => i + 1);
			setShowRejectForm(false);
			setRejectionReason("");
			setRejectionError("");
		}
	};

	const handlePrev = () => {
		if (!isFirst) {
			setCurrentIndex((i) => i - 1);
			setShowRejectForm(false);
			setRejectionReason("");
			setRejectionError("");
		}
	};

	const handleReject = () => {
		const trimmedReason = rejectionReason.trim();
		if (!trimmedReason) {
			setRejectionError("Motivo da rejeicao e obrigatorio");
			return;
		}
		if (trimmedReason.length < 10) {
			setRejectionError("Motivo deve ter pelo menos 10 caracteres");
			return;
		}
		setRejectionError("");
		rejectDraft({ id: currentDraft._id, reason: trimmedReason });
	};

	if (!currentDraft) return null;

	return (
		<>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent
					className="max-w-2xl max-h-[90vh] overflow-y-auto"
					onInteractOutside={(e) => e.preventDefault()}
				>
					<DialogHeader>
						<div className="flex items-center justify-between">
							<DialogTitle>Revisar Todos</DialogTitle>
							<Badge variant="outline">
								{currentIndex + 1} de {drafts.length}
							</Badge>
						</div>
						<DialogDescription>
							Revise cada draft pendente em sequencia
						</DialogDescription>
					</DialogHeader>

					{/* Progress dots */}
					<div className="flex justify-center gap-1 py-2">
						{drafts.map((_, i) => (
							<div
								key={drafts[i]._id}
								className={cn(
									"w-2 h-2 rounded-full transition-colors",
									i < currentIndex
										? "bg-primary"
										: i === currentIndex
											? "bg-primary ring-2 ring-offset-2 ring-primary"
											: "bg-muted",
								)}
							/>
						))}
					</div>

					{/* Draft content */}
					<div className="space-y-4 py-4">
						<div className="rounded-lg bg-muted/50 p-4">
							<p className="whitespace-pre-wrap text-sm">
								{currentDraft.content}
							</p>
							<span className="mt-2 block text-xs text-muted-foreground">
								{currentDraft.content.length}/280 caracteres
							</span>
						</div>

						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<span>Autor: {currentDraft.authorName || "Desconhecido"}</span>
						</div>

						{/* Reject form */}
						{showRejectForm && (
							<div className="space-y-3 border-t pt-4">
								<span className="text-sm font-medium text-muted-foreground">
									Motivo da rejeicao *
								</span>
								<Textarea
									ref={textareaRef}
									value={rejectionReason}
									onChange={(e) => {
										setRejectionReason(e.target.value);
										setRejectionError("");
									}}
									placeholder="Descreva o motivo (minimo 10 caracteres)..."
									className="min-h-20 resize-none"
								/>
								{rejectionError && (
									<p className="text-sm text-destructive">{rejectionError}</p>
								)}
							</div>
						)}
					</div>

					<DialogFooter className="flex-col gap-4 sm:flex-col">
						{/* Action buttons */}
						<div className="flex w-full gap-2 justify-end">
							{!showRejectForm ? (
								<>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowScheduleDialog(true)}
									>
										<Calendar className="h-4 w-4 mr-1" />
										Agendar
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowRejectForm(true)}
									>
										<XCircle className="h-4 w-4 mr-1" />
										Rejeitar
									</Button>
									<HoldButton
										size="sm"
										onComplete={() => approveDraft({ id: currentDraft._id })}
										disabled={isApproving}
										className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90"
										holdDuration={500}
									>
										<CheckCircle className="h-4 w-4 mr-1" />
										{isApproving ? "Aprovando..." : "Aprovar"}
									</HoldButton>
								</>
							) : (
								<>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setShowRejectForm(false);
											setRejectionReason("");
											setRejectionError("");
										}}
									>
										Cancelar
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={handleReject}
										disabled={isRejecting || rejectionReason.trim().length < 10}
									>
										Confirmar Rejeicao
									</Button>
								</>
							)}
						</div>

						{/* Navigation */}
						<div className="flex w-full justify-between border-t pt-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={handlePrev}
								disabled={isFirst}
							>
								<ChevronLeft className="h-4 w-4 mr-1" />
								Anterior
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onOpenChange(false)}
							>
								Fechar
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleNext}
								disabled={isLast}
							>
								Pular
								<ChevronRight className="h-4 w-4 ml-1" />
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{currentDraft && (
				<ScheduleDialog
					draft={currentDraft}
					open={showScheduleDialog}
					onOpenChange={setShowScheduleDialog}
				/>
			)}
		</>
	);
}
