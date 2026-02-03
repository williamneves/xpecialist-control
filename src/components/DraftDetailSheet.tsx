import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HoldButton } from "@/components/ui/hold-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
	CheckCircle,
	XCircle,
	Clock,
	Calendar,
	User,
	Twitter,
	Trash2,
	Edit3,
	ExternalLink,
} from "lucide-react";
import { useState } from "react";

type Draft = Doc<"drafts">;

interface DraftDetailSheetProps {
	draft: Draft | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onActionComplete?: (action: "approve" | "reject") => void;
}

const statusConfig = {
	pending: { label: "Pendente", variant: "outline" as const, icon: Clock },
	approved: {
		label: "Aprovado",
		variant: "default" as const,
		icon: CheckCircle,
	},
	rejected: {
		label: "Rejeitado",
		variant: "destructive" as const,
		icon: XCircle,
	},
	scheduled: {
		label: "Agendado",
		variant: "secondary" as const,
		icon: Calendar,
	},
	published: { label: "Publicado", variant: "default" as const, icon: Twitter },
};

function formatDate(timestamp: number) {
	return new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(timestamp));
}

export default function DraftDetailSheet({
	draft,
	open,
	onOpenChange,
	onActionComplete,
}: DraftDetailSheetProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState("");
	const [rejectionReason, setRejectionReason] = useState("");
	const [rejectionError, setRejectionError] = useState("");
	const [showRejectForm, setShowRejectForm] = useState(false);

	const { mutate: approveDraft, isPending: isApproving } = useMutation({
		mutationFn: useConvexMutation(api.drafts.approve),
		onSuccess: () => {
			toast.success("Draft aprovado!");
			if (onActionComplete) {
				onActionComplete("approve");
			} else {
				onOpenChange(false);
			}
		},
		onError: (error) => toast.error(`Erro: ${error.message}`),
	});

	const { mutate: rejectDraft, isPending: isRejecting } = useMutation({
		mutationFn: useConvexMutation(api.drafts.reject),
		onSuccess: () => {
			toast.success("Draft rejeitado");
			setShowRejectForm(false);
			setRejectionReason("");
			if (onActionComplete) {
				onActionComplete("reject");
			} else {
				onOpenChange(false);
			}
		},
		onError: (error) => toast.error(`Erro: ${error.message}`),
	});

	const { mutate: updateContent, isPending: isUpdating } = useMutation({
		mutationFn: useConvexMutation(api.drafts.updateContent),
		onSuccess: () => {
			toast.success("Conteúdo atualizado!");
			setIsEditing(false);
		},
		onError: (error) => toast.error(`Erro: ${error.message}`),
	});

	const { mutate: removeDraft, isPending: isRemoving } = useMutation({
		mutationFn: useConvexMutation(api.drafts.remove),
		onSuccess: () => {
			toast.success("Draft removido");
			onOpenChange(false);
		},
		onError: (error) => toast.error(`Erro: ${error.message}`),
	});

	if (!draft) return null;

	const status = statusConfig[draft.status];
	const StatusIcon = status.icon;
	const canEdit = draft.status !== "published";
	const canApprove = draft.status === "pending";
	const canDelete = draft.status !== "published";

	const handleStartEdit = () => {
		setEditedContent(draft.content);
		setIsEditing(true);
	};

	const handleSaveEdit = () => {
		if (editedContent.trim() && editedContent !== draft.content) {
			updateContent({ id: draft._id, content: editedContent });
		} else {
			setIsEditing(false);
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
		rejectDraft({
			id: draft._id,
			reason: trimmedReason,
		});
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
				<SheetHeader>
					<div className="flex items-center gap-2">
						<Badge variant={status.variant} className="gap-1">
							<StatusIcon className="h-3 w-3" />
							{status.label}
						</Badge>
						{draft.metadata?.type === "thread" && (
							<Badge variant="outline">Thread</Badge>
						)}
					</div>
					<SheetTitle>Detalhes do Draft</SheetTitle>
					<SheetDescription>
						Criado em {formatDate(draft.createdAt)}
					</SheetDescription>
				</SheetHeader>

				<div className="flex-1 space-y-6 px-4 py-6">
					{/* Content */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-muted-foreground">
								Conteúdo
							</span>
							{canEdit && !isEditing && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleStartEdit}
									className="h-7 gap-1"
								>
									<Edit3 className="h-3 w-3" />
									Editar
								</Button>
							)}
						</div>
						{isEditing ? (
							<div className="space-y-2">
								<Textarea
									value={editedContent}
									onChange={(e) => setEditedContent(e.target.value)}
									className="min-h-32 resize-none"
									maxLength={280}
								/>
								<div className="flex items-center justify-between">
									<span className="text-xs text-muted-foreground">
										{editedContent.length}/280
									</span>
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setIsEditing(false)}
										>
											Cancelar
										</Button>
										<Button
											size="sm"
											onClick={handleSaveEdit}
											disabled={isUpdating}
										>
											Salvar
										</Button>
									</div>
								</div>
							</div>
						) : (
							<div className="rounded-lg bg-muted/50 p-4">
								<p className="whitespace-pre-wrap text-sm">{draft.content}</p>
								<span className="mt-2 block text-xs text-muted-foreground">
									{draft.content.length}/280 caracteres
								</span>
							</div>
						)}
					</div>

					<Separator />

					{/* Author Info */}
					<div className="space-y-3">
						<span className="text-sm font-medium text-muted-foreground">
							Informações
						</span>
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm">
								<User className="h-4 w-4 text-muted-foreground" />
								<span>{draft.authorName || "Autor desconhecido"}</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<Clock className="h-4 w-4 text-muted-foreground" />
								<span>Atualizado em {formatDate(draft.updatedAt)}</span>
							</div>
							{draft.scheduledFor && (
								<div className="flex items-center gap-2 text-sm">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<span>Agendado para {formatDate(draft.scheduledFor)}</span>
								</div>
							)}
							{draft.publishedAt && (
								<div className="flex items-center gap-2 text-sm">
									<Twitter className="h-4 w-4 text-[#1DA1F2]" />
									<span>Publicado em {formatDate(draft.publishedAt)}</span>
								</div>
							)}
						</div>
					</div>

					{/* Tags */}
					{draft.metadata?.tags && draft.metadata.tags.length > 0 && (
						<>
							<Separator />
							<div className="space-y-2">
								<span className="text-sm font-medium text-muted-foreground">
									Tags
								</span>
								<div className="flex flex-wrap gap-1">
									{draft.metadata.tags.map((tag) => (
										<Badge key={tag} variant="secondary" className="text-xs">
											{tag}
										</Badge>
									))}
								</div>
							</div>
						</>
					)}

					{/* Rejection Reason */}
					{draft.status === "rejected" && draft.rejectionReason && (
						<>
							<Separator />
							<div className="space-y-2">
								<span className="text-sm font-medium text-destructive">
									Motivo da Rejeição
								</span>
								<p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
									{draft.rejectionReason}
								</p>
							</div>
						</>
					)}

					{/* Tweet Link */}
					{draft.tweetId && (
						<>
							<Separator />
							<a
								href={`https://twitter.com/i/web/status/${draft.tweetId}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 text-sm text-[#1DA1F2] hover:underline"
							>
								<ExternalLink className="h-4 w-4" />
								Ver no Twitter/X
							</a>
						</>
					)}

					{/* Reject Form */}
					{showRejectForm && (
						<>
							<Separator />
							<div className="space-y-3">
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
										Confirmar Rejeicao
									</Button>
								</div>
							</div>
						</>
					)}
				</div>

				<SheetFooter className="border-t">
					<div className="flex w-full gap-2">
						{canDelete && (
							<Button
								variant="ghost"
								size="sm"
								className="text-destructive hover:text-destructive hover:bg-destructive/10"
								onClick={() => removeDraft({ id: draft._id })}
								disabled={isRemoving}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
						<div className="flex-1" />
						{canApprove && !showRejectForm && (
							<>
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
									onComplete={() => approveDraft({ id: draft._id })}
									disabled={isApproving}
									className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90"
									holdDuration={500}
								>
									<CheckCircle className="h-4 w-4 mr-1" />
									{isApproving ? "Aprovando..." : "Segurar para Aprovar"}
								</HoldButton>
							</>
						)}
					</div>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
