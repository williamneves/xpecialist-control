import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { toast } from "sonner";
import {
	FileText,
	Clock,
	CheckCircle,
	XCircle,
	Calendar,
	RefreshCw,
} from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import DraftDetailSheet from "@/components/DraftDetailSheet";

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

function truncateContent(content: string, maxLength = 80) {
	if (content.length <= maxLength) return content;
	return content.slice(0, maxLength) + "...";
}

type DraftStatus =
	| "pending"
	| "approved"
	| "rejected"
	| "scheduled"
	| "published";

function Dashboard() {
	const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
	const [selectedIndex, setSelectedIndex] = useState<number>(-1);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<DraftStatus>("pending");

	const {
		data: drafts,
		isLoading,
		refetch,
		isRefetching,
	} = useQuery(convexQuery(api.drafts.listAll, { status: activeTab }));

	const handleRowClick = (draft: Draft, index: number) => {
		setSelectedDraft(draft);
		setSelectedIndex(index);
		setSheetOpen(true);
	};

	const handleSheetClose = (open: boolean) => {
		setSheetOpen(open);
		if (!open) {
			setTimeout(() => setSelectedDraft(null), 300);
		}
	};

	const handleActionComplete = (_action: "approve" | "reject") => {
		// Only auto-advance when viewing pending tab
		if (activeTab !== "pending") {
			setSheetOpen(false);
			return;
		}

		// Small delay to let Convex real-time update propagate
		// The current draft will be removed from the list after the action
		// So the "next" draft will be at the same index
		setTimeout(() => {
			// At this point, drafts should be updated without the actioned draft
			if (drafts && selectedIndex < drafts.length) {
				// Draft at selectedIndex is now the "next" one
				setSelectedDraft(drafts[selectedIndex]);
			} else if (drafts && drafts.length > 0) {
				// If we were at the end, show the last remaining draft
				const lastIndex = drafts.length - 1;
				setSelectedDraft(drafts[lastIndex]);
				setSelectedIndex(lastIndex);
			} else {
				// No more pending drafts
				setSheetOpen(false);
				toast.success("Todos os drafts pendentes foram revisados!");
			}
		}, 500);
	};

	return (
		<>
			<SignedIn>
				<div className="container max-w-screen-2xl py-8 px-4">
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
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5 text-[#1DA1F2]" />
								Drafts
							</CardTitle>
							<CardDescription>
								{drafts?.length ?? 0} draft(s) no status selecionado
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs
								value={activeTab}
								onValueChange={(v) => setActiveTab(v as DraftStatus)}
								className="w-full"
							>
								<TabsList className="grid w-full grid-cols-5 mb-6">
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
									<TabsTrigger value="scheduled" className="gap-1">
										<Calendar className="h-3 w-3" />
										<span className="hidden sm:inline">Agendados</span>
									</TabsTrigger>
									<TabsTrigger value="published" className="gap-1">
										<FileText className="h-3 w-3" />
										<span className="hidden sm:inline">Publicados</span>
									</TabsTrigger>
								</TabsList>

								{isLoading ? (
									<div className="space-y-4">
										{[...Array(5)].map((_, i) => (
											<div key={i} className="flex items-center gap-4">
												<Skeleton className="h-4 w-full" />
											</div>
										))}
									</div>
								) : drafts && drafts.length > 0 ? (
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
																{draft.status === "scheduled" &&
																	draft.scheduledFor && (
																		<span className="text-muted-foreground">
																			{formatDate(draft.scheduledFor)}
																		</span>
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
											{activeTab === "pending"
												? "Todos os drafts foram revisados. Novos drafts aparecerao aqui."
												: `Nenhum draft com status "${statusConfig[activeTab].label}".`}
										</p>
									</div>
								)}
							</Tabs>
						</CardContent>
					</Card>

					<DraftDetailSheet
						draft={selectedDraft}
						open={sheetOpen}
						onOpenChange={handleSheetClose}
						onActionComplete={handleActionComplete}
					/>
				</div>
			</SignedIn>
			<SignedOut>
				<div className="container max-w-screen-2xl py-8 px-4 flex items-center justify-center min-h-[60vh]">
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
				</div>
			</SignedOut>
		</>
	);
}
