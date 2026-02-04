import {
	SignedIn,
	SignedOut,
	SignInButton,
	useAuth,
} from "@clerk/clerk-react";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Calendar,
	CheckCircle,
	Clock,
	FileText,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import DraftDetailDialog from "@/components/DraftDetailDialog";
import { KeyboardHelpDialog } from "@/components/KeyboardHelpDialog";
import { PageContainer } from "@/components/PageContainer";
import { ReviewWizardDialog } from "@/components/ReviewWizardDialog";
import { ThreadGroup } from "@/components/ThreadGroup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/")({ component: Dashboard });

type Draft = Doc<"drafts">;

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
	published: {
		label: "Publicado",
		variant: "default" as const,
		icon: FileText,
	},
};

function formatDate(timestamp: number) {
	return new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "short",
		timeStyle: "short",
	}).format(new Date(timestamp));
}

function formatScheduledTime(timestamp: number): string {
	return new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	}).format(new Date(timestamp));
}

function truncateContent(content: string, maxLength = 80) {
	if (content.length <= maxLength) return content;
	return `${content.slice(0, maxLength)}...`;
}

type DraftStatus = "pending" | "approved" | "rejected" | "published";

function Dashboard() {
	const { isLoaded } = useAuth();
	const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
	const [_selectedIndex, setSelectedIndex] = useState<number>(-1);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<DraftStatus>("pending");
	const [showRejectForm, setShowRejectForm] = useState(false);
	const [startEditMode, setStartEditMode] = useState(false);
	const [wizardOpen, setWizardOpen] = useState(false);

	// Grouped query for pending tab (threads + singles)
	const {
		data: groupedDrafts,
		isLoading: isLoadingGrouped,
		refetch: refetchGrouped,
		isRefetching: isRefetchingGrouped,
	} = useQuery({
		...convexQuery(api.drafts.listPendingGrouped, {}),
		enabled: activeTab === "pending",
	});

	// Flat query for other status tabs
	const {
		data: drafts,
		isLoading: isLoadingFlat,
		refetch: refetchFlat,
		isRefetching: isRefetchingFlat,
	} = useQuery({
		...convexQuery(api.drafts.listAll, { status: activeTab }),
		enabled: activeTab !== "pending",
	});

	const isLoading = activeTab === "pending" ? isLoadingGrouped : isLoadingFlat;
	const isRefetching =
		activeTab === "pending" ? isRefetchingGrouped : isRefetchingFlat;
	const refetch = activeTab === "pending" ? refetchGrouped : refetchFlat;

	// Mutations for keyboard-triggered actions
	const { mutate: approveMutation } = useMutation({
		mutationFn: useConvexMutation(api.drafts.approve),
		onSuccess: () => {
			toast.success("Draft aprovado!");
			handleActionComplete("approve");
		},
		onError: (error) => toast.error(`Erro: ${error.message}`),
	});

	const { mutate: rejectMutation } = useMutation({
		mutationFn: useConvexMutation(api.drafts.reject),
		onSuccess: () => {
			toast.success("Draft rejeitado");
			handleActionComplete("reject");
		},
		onError: (error) => toast.error(`Erro: ${error.message}`),
	});

	// Flat list of navigable drafts (singles only from pending view)
	const flatDraftList = useMemo(() => {
		if (activeTab !== "pending" || !groupedDrafts) return [];
		return groupedDrafts
			.filter((group) => group.type === "single")
			.map((group) => group.drafts[0]);
	}, [activeTab, groupedDrafts]);

	// Keyboard action handlers
	const handleKeyboardApprove = () => {
		if (selectedDraft && selectedDraft.status === "pending") {
			approveMutation({ id: selectedDraft._id });
		}
	};

	const handleKeyboardRejectQuick = () => {
		if (selectedDraft && selectedDraft.status === "pending") {
			rejectMutation({
				id: selectedDraft._id,
				reason: "Rejeitado via atalho de teclado",
			});
		}
	};

	const handleKeyboardRejectWithReason = () => {
		if (selectedDraft && selectedDraft.status === "pending") {
			setShowRejectForm(true);
			setSheetOpen(true);
		}
	};

	const handleKeyboardEdit = () => {
		if (selectedDraft && selectedDraft.status !== "published") {
			setStartEditMode(true);
			setSheetOpen(true);
		}
	};

	const handleNavigateNext = () => {
		if (flatDraftList.length === 0) return;
		const currentIndex = selectedDraft
			? flatDraftList.findIndex((d) => d._id === selectedDraft._id)
			: -1;
		const nextIndex =
			currentIndex < flatDraftList.length - 1 ? currentIndex + 1 : currentIndex;
		if (nextIndex >= 0 && nextIndex < flatDraftList.length) {
			setSelectedDraft(flatDraftList[nextIndex]);
			setSelectedIndex(nextIndex);
		}
	};

	const handleNavigatePrev = () => {
		if (flatDraftList.length === 0) return;
		const currentIndex = selectedDraft
			? flatDraftList.findIndex((d) => d._id === selectedDraft._id)
			: -1;
		const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
		if (prevIndex >= 0 && prevIndex < flatDraftList.length) {
			setSelectedDraft(flatDraftList[prevIndex]);
			setSelectedIndex(prevIndex);
		}
	};

	// Use keyboard shortcuts hook
	const { helpOpen, setHelpOpen, isArmed, isRejectArmed } =
		useKeyboardShortcuts({
			selectedDraft,
			onApprove: handleKeyboardApprove,
			onRejectQuick: handleKeyboardRejectQuick,
			onRejectWithReason: handleKeyboardRejectWithReason,
			onEdit: handleKeyboardEdit,
			onNavigateNext: handleNavigateNext,
			onNavigatePrev: handleNavigatePrev,
		});

	const handleRowClick = (draft: Draft, index: number) => {
		setSelectedDraft(draft);
		setSelectedIndex(index);
		setSheetOpen(true);
	};

	const handleSheetClose = (open: boolean) => {
		setSheetOpen(open);
		if (!open) {
			setTimeout(() => setSelectedDraft(null), 300);
			setShowRejectForm(false);
			setStartEditMode(false);
		}
	};

	// Handler for single draft actions (from sheet)
	const handleActionComplete = (_action: "approve" | "reject") => {
		// Only auto-advance when viewing pending tab
		if (activeTab !== "pending") {
			setSheetOpen(false);
			return;
		}

		// Small delay to let Convex real-time update propagate
		setTimeout(() => {
			// For grouped view, we need to find next single in the groups
			if (groupedDrafts && groupedDrafts.length > 0) {
				// Find next single draft to show
				let foundNext = false;
				for (let i = 0; i < groupedDrafts.length; i++) {
					const group = groupedDrafts[i];
					if (group.type === "single") {
						// Check if this is not the draft we just actioned
						if (group.drafts[0]._id !== selectedDraft?._id) {
							setSelectedDraft(group.drafts[0]);
							setSelectedIndex(i);
							foundNext = true;
							break;
						}
					}
				}
				if (!foundNext) {
					// No more singles, close sheet
					setSheetOpen(false);
					if (groupedDrafts.length === 0) {
						toast.success("Todos os drafts pendentes foram revisados!");
					}
				}
			} else {
				// No more pending drafts
				setSheetOpen(false);
				toast.success("Todos os drafts pendentes foram revisados!");
			}
		}, 500);
	};

	// Handler for thread group actions (from ThreadGroup component)
	const handleGroupActionComplete = () => {
		// Threads handle their own actions inline, just toast on completion
		// Convex real-time will update the list automatically
	};

	// Calculate item count for card description
	const itemCount =
		activeTab === "pending"
			? (groupedDrafts?.length ?? 0)
			: (drafts?.length ?? 0);

	// Show skeleton while Clerk auth is loading
	if (!isLoaded) {
		return (
			<PageContainer>
				<div className="flex items-center justify-between mb-8">
					<div>
						<Skeleton className="h-9 w-48 mb-2" />
						<Skeleton className="h-5 w-72" />
					</div>
					<Skeleton className="h-9 w-24" />
				</div>
				<Skeleton className="h-96 w-full rounded-lg" />
			</PageContainer>
		);
	}

	return (
		<>
			<SignedIn>
				<PageContainer>
					<div className="flex items-center justify-between mb-8">
						<div>
							<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
							<p className="text-muted-foreground mt-1">
								Gerencie seus drafts pendentes de aprovação
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => refetch()}
							disabled={isRefetching}
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`}
							/>
							Atualizar
						</Button>
					</div>

					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5 text-[#1DA1F2]" />
									Drafts
								</CardTitle>
								{activeTab === "pending" && flatDraftList.length > 0 && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => setWizardOpen(true)}
									>
										Revisar Todos
									</Button>
								)}
							</div>
							<CardDescription>
								{activeTab === "pending"
									? `${itemCount} item(s) pendente(s)`
									: `${itemCount} draft(s) no status selecionado`}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs
								value={activeTab}
								onValueChange={(v) => setActiveTab(v as DraftStatus)}
								className="w-full"
							>
								<TabsList className="grid w-full grid-cols-4 mb-6">
									<TabsTrigger value="pending" className="gap-1">
										<Clock className="h-3 w-3" />
										<span className="hidden sm:inline">Pendentes</span>
									</TabsTrigger>
									<TabsTrigger value="approved" className="gap-1">
										<CheckCircle className="h-3 w-3" />
										<span className="hidden sm:inline">Aprovados</span>
									</TabsTrigger>
									<TabsTrigger value="rejected" className="gap-1">
										<XCircle className="h-3 w-3" />
										<span className="hidden sm:inline">Rejeitados</span>
									</TabsTrigger>
									<TabsTrigger value="published" className="gap-1">
										<FileText className="h-3 w-3" />
										<span className="hidden sm:inline">Publicados</span>
									</TabsTrigger>
								</TabsList>

								{isLoading ? (
									<div className="space-y-4">
										{[...Array(5)].map((_, i) => (
											<div
												key={`skeleton-${i}`}
												className="flex items-center gap-4"
											>
												<Skeleton className="h-4 w-full" />
											</div>
										))}
									</div>
								) : activeTab === "pending" ? (
									// Grouped view for pending tab
									groupedDrafts && groupedDrafts.length > 0 ? (
										<div className="space-y-4">
											{groupedDrafts.map((group) =>
												group.type === "thread" && group.threadId ? (
													<ThreadGroup
														key={group.threadId}
														threadId={group.threadId}
														drafts={group.drafts}
														onActionComplete={handleGroupActionComplete}
													/>
												) : (
													// Single draft - show as clickable card
													<Card
														key={group.drafts[0]._id}
														className={cn(
															"cursor-pointer hover:bg-muted/50 transition-colors",
															// Approve armed: blue ring
															isArmed &&
																selectedDraft?._id === group.drafts[0]._id &&
																"ring-2 ring-offset-2 ring-[#1DA1F2] animate-pulse",
															// Reject armed: red/destructive ring
															isRejectArmed &&
																selectedDraft?._id === group.drafts[0]._id &&
																"ring-2 ring-offset-2 ring-destructive animate-pulse",
														)}
														onClick={() => {
															const idx = groupedDrafts?.indexOf(group) ?? 0;
															handleRowClick(group.drafts[0], idx);
														}}
													>
														<CardContent className="p-4">
															<div className="flex items-center justify-between">
																<div className="flex-1 min-w-0">
																	<p className="line-clamp-2 text-sm">
																		{group.drafts[0].content}
																	</p>
																	<div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
																		<span>
																			{group.drafts[0].content.length}/280
																		</span>
																		<span>•</span>
																		<span>
																			{group.drafts[0].authorName ||
																				"Desconhecido"}
																		</span>
																	</div>
																</div>
																<Badge variant="outline" className="ml-4">
																	Single
																</Badge>
															</div>
														</CardContent>
													</Card>
												),
											)}
										</div>
									) : (
										// Empty state for pending
										<div className="flex flex-col items-center justify-center py-12 text-center">
											<div className="rounded-full bg-muted p-4 mb-4">
												<CheckCircle className="h-8 w-8 text-muted-foreground" />
											</div>
											<h3 className="text-lg font-medium">
												Nenhum draft pendente
											</h3>
											<p className="text-muted-foreground mt-1 max-w-sm">
												Todos os drafts foram revisados. Novos drafts aparecerao
												aqui.
											</p>
										</div>
									)
								) : // Table view for other statuses
								drafts && drafts.length > 0 ? (
									<TooltipProvider>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="w-[40%]">Conteudo</TableHead>
													<TableHead>Autor</TableHead>
													<TableHead>Tipo</TableHead>
													<TableHead>Criado em</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Info</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{drafts.map((draft, index) => {
													const status = statusConfig[draft.status];
													const StatusIcon = status.icon;
													return (
														<TableRow
															key={draft._id}
															className="cursor-pointer hover:bg-muted/50"
															onClick={() => handleRowClick(draft, index)}
														>
															<TableCell className="font-medium">
																<p className="line-clamp-2">
																	{truncateContent(draft.content)}
																</p>
															</TableCell>
															<TableCell className="text-muted-foreground">
																{draft.authorName || "Desconhecido"}
															</TableCell>
															<TableCell>
																<Badge variant="outline" className="capitalize">
																	{draft.metadata?.type || "single"}
																</Badge>
															</TableCell>
															<TableCell className="text-muted-foreground text-sm">
																{formatDate(draft.createdAt)}
															</TableCell>
															<TableCell>
																<Badge
																	variant={status.variant}
																	className="gap-1"
																>
																	<StatusIcon className="h-3 w-3" />
																	{status.label}
																</Badge>
															</TableCell>
															<TableCell className="text-muted-foreground text-sm">
																{draft.status === "rejected" &&
																	draft.rejectionReason && (
																		<Tooltip>
																			<TooltipTrigger asChild>
																				<span className="text-destructive truncate max-w-[120px] inline-block cursor-help">
																					{draft.rejectionReason.slice(0, 20)}
																					...
																				</span>
																			</TooltipTrigger>
																			<TooltipContent
																				side="top"
																				className="max-w-xs"
																			>
																				<p>{draft.rejectionReason}</p>
																			</TooltipContent>
																		</Tooltip>
																	)}
																{draft.status === "approved" &&
																	draft.scheduledFor && (
																		<div className="flex items-center gap-2 text-muted-foreground">
																			<Calendar className="h-4 w-4" />
																			<span>
																				{formatScheduledTime(
																					draft.scheduledFor,
																				)}
																			</span>
																		</div>
																	)}
																{draft.status === "published" &&
																	draft.publishedAt && (
																		<span className="text-muted-foreground">
																			{formatDate(draft.publishedAt)}
																		</span>
																	)}
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</TooltipProvider>
								) : (
									<div className="flex flex-col items-center justify-center py-12 text-center">
										<div className="rounded-full bg-muted p-4 mb-4">
											<CheckCircle className="h-8 w-8 text-muted-foreground" />
										</div>
										<h3 className="text-lg font-medium">Nenhum draft</h3>
										<p className="text-muted-foreground mt-1 max-w-sm">
											{`Nenhum draft com status "${statusConfig[activeTab].label}".`}
										</p>
									</div>
								)}
							</Tabs>
						</CardContent>
					</Card>

					<DraftDetailDialog
						draft={selectedDraft}
						open={sheetOpen}
						onOpenChange={handleSheetClose}
						onActionComplete={handleActionComplete}
						isArmed={isArmed}
						isRejectArmed={isRejectArmed}
						initialShowRejectForm={showRejectForm}
						initialEditMode={startEditMode}
					/>

					<KeyboardHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />

					<ReviewWizardDialog
						drafts={flatDraftList}
						open={wizardOpen}
						onOpenChange={setWizardOpen}
					/>
				</PageContainer>
			</SignedIn>
			<SignedOut>
				<PageContainer className="flex items-center justify-center min-h-[60vh]">
					<Card className="w-full max-w-md">
						<CardHeader className="text-center">
							<CardTitle>Acesso Restrito</CardTitle>
							<CardDescription>
								Faca login para acessar o dashboard
							</CardDescription>
						</CardHeader>
						<CardContent className="flex justify-center">
							<SignInButton mode="modal">
								<Button className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90">
									Entrar com Clerk
								</Button>
							</SignInButton>
						</CardContent>
					</Card>
				</PageContainer>
			</SignedOut>
		</>
	);
}
