import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import {
	CheckCircle,
	ChevronDown,
	ChevronRight,
	MessageSquare,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { HoldButton } from "@/components/ui/hold-button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

type Draft = Doc<"drafts">;

interface ThreadGroupProps {
	threadId: string;
	drafts: Draft[];
	onActionComplete?: () => void;
}

export function ThreadGroup({
	threadId,
	drafts,
	onActionComplete,
}: ThreadGroupProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [showRejectForm, setShowRejectForm] = useState(false);
	const [rejectionReason, setRejectionReason] = useState("");
	const [rejectionError, setRejectionError] = useState("");

	const { mutate: approveThread, isPending: isApproving } = useMutation({
		mutationFn: useConvexMutation(api.drafts.approveThread),
		onSuccess: (count) => {
			toast.success(`Thread aprovada! (${count} drafts)`);
			onActionComplete?.();
		},
		onError: (error) => toast.error(`Erro: ${error.message}`),
	});

	const { mutate: rejectThread, isPending: isRejecting } = useMutation({
		mutationFn: useConvexMutation(api.drafts.rejectThread),
		onSuccess: (count) => {
			toast.success(`Thread rejeitada (${count} drafts)`);
			setShowRejectForm(false);
			setRejectionReason("");
			onActionComplete?.();
		},
		onError: (error) => toast.error(`Erro: ${error.message}`),
	});

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
		rejectThread({ threadId, reason: trimmedReason });
	};

	const totalChars = drafts.reduce((sum, d) => sum + d.content.length, 0);

	return (
		<Card className="mb-4">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<div className="flex items-center justify-between p-4">
					<CollapsibleTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-2 text-left hover:bg-muted/50 rounded-lg p-2 -m-2"
						>
							{isOpen ? (
								<ChevronDown className="h-4 w-4 text-muted-foreground" />
							) : (
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							)}
							<MessageSquare className="h-4 w-4 text-[#1DA1F2]" />
							<span className="font-medium">
								Thread ({drafts.length} tweets)
							</span>
							<Badge variant="outline" className="ml-2">
								{totalChars} caracteres total
							</Badge>
						</button>
					</CollapsibleTrigger>

					{!showRejectForm && (
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowRejectForm(true)}
								disabled={isApproving || isRejecting}
							>
								<XCircle className="h-4 w-4 mr-1" />
								Rejeitar Thread
							</Button>
							<HoldButton
								size="sm"
								onComplete={() => approveThread({ threadId })}
								disabled={isApproving || isRejecting}
								className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90"
								holdDuration={500}
							>
								<CheckCircle className="h-4 w-4 mr-1" />
								{isApproving ? "Aprovando..." : "Segurar para Aprovar"}
							</HoldButton>
						</div>
					)}
				</div>

				{showRejectForm && (
					<div className="px-4 pb-4 space-y-3 border-t pt-3">
						<span className="text-sm font-medium text-muted-foreground">
							Motivo da rejeicao *
						</span>
						<Textarea
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
						<div className="flex gap-2">
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
								Confirmar Rejeicao da Thread
							</Button>
						</div>
					</div>
				)}

				<CollapsibleContent>
					<CardContent className="pt-0 space-y-3">
						{drafts.map((draft, index) => (
							<div
								key={draft._id}
								className="rounded-lg bg-muted/50 p-3 border-l-2 border-[#1DA1F2]"
							>
								<div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
									<span className="font-medium">
										Tweet {index + 1}/{drafts.length}
									</span>
									<span>•</span>
									<span>{draft.content.length}/280</span>
								</div>
								<p className="text-sm whitespace-pre-wrap">{draft.content}</p>
							</div>
						))}
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}
