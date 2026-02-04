import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { useState, useId } from "react";
import { toast } from "sonner";
import {
	Key,
	Copy,
	Trash2,
	Shield,
	Loader2,
	Check,
	AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/settings/api-tokens")({
	component: ApiTokensPage,
});

// All available permissions
const PERMISSIONS = {
	drafts: [
		{ value: "drafts:read", label: "Ler rascunhos" },
		{ value: "drafts:create", label: "Criar rascunhos" },
		{ value: "drafts:approve", label: "Aprovar rascunhos" },
		{ value: "drafts:reject", label: "Rejeitar rascunhos" },
		{ value: "drafts:schedule", label: "Agendar rascunhos" },
		{ value: "drafts:publish", label: "Publicar rascunhos" },
	],
	tokens: [
		{ value: "tokens:read", label: "Listar tokens" },
		{ value: "tokens:create", label: "Criar tokens" },
		{ value: "tokens:revoke", label: "Revogar tokens" },
	],
} as const;

function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatRelativeDate(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days === 0) return "Hoje";
	if (days === 1) return "Ontem";
	if (days < 7) return `${days} dias atras`;
	if (days < 30) return `${Math.floor(days / 7)} semanas atras`;
	return formatDate(timestamp);
}

function ApiTokensPage() {
	const { user } = useUser();
	const descriptionId = useId();
	const expiresId = useId();
	const [description, setDescription] = useState("");
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
	const [expiresInDays, setExpiresInDays] = useState<string>("");
	const [createdToken, setCreatedToken] = useState<{
		token: string;
		prefix: string;
	} | null>(null);
	const [copied, setCopied] = useState(false);

	// Query for listing tokens
	const { data: tokens, isLoading: isLoadingTokens } = useQuery(
		convexQuery(
			api.tokens.listTokens,
			user?.id ? { createdBy: user.id } : "skip",
		),
	);

	// Mutation for creating tokens
	const { mutate: createToken, isPending: isCreating } = useMutation({
		mutationFn: useConvexMutation(api.tokens.createToken),
		onSuccess: (result: { token: string; prefix: string }) => {
			setCreatedToken(result);
			setDescription("");
			setSelectedPermissions([]);
			setExpiresInDays("");
			toast.success("Token criado com sucesso!");
		},
		onError: (error) => {
			toast.error(`Erro ao criar token: ${error.message}`);
		},
	});

	// Mutation for revoking tokens
	const { mutate: revokeToken, isPending: isRevoking } = useMutation({
		mutationFn: useConvexMutation(api.tokens.revokeToken),
		onSuccess: () => {
			toast.success("Token revogado com sucesso!");
		},
		onError: (error) => {
			toast.error(`Erro ao revogar token: ${error.message}`);
		},
	});

	const handlePermissionChange = (permission: string, checked: boolean) => {
		if (checked) {
			setSelectedPermissions([...selectedPermissions, permission]);
		} else {
			setSelectedPermissions(
				selectedPermissions.filter((p) => p !== permission),
			);
		}
	};

	const handleCreateToken = (e: React.FormEvent) => {
		e.preventDefault();

		if (!description.trim()) {
			toast.error("A descricao do token e obrigatoria");
			return;
		}

		if (selectedPermissions.length === 0) {
			toast.error("Selecione pelo menos uma permissao");
			return;
		}

		const expiresAt = expiresInDays
			? Date.now() + parseInt(expiresInDays, 10) * 24 * 60 * 60 * 1000
			: undefined;

		createToken({
			description: description.trim(),
			permissions: selectedPermissions,
			expiresAt,
			createdBy: user?.id || "anonymous",
		});
	};

	const handleCopyToken = async () => {
		if (createdToken) {
			await navigator.clipboard.writeText(createdToken.token);
			setCopied(true);
			toast.success("Token copiado!");
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleDismissToken = () => {
		setCreatedToken(null);
		setCopied(false);
	};

	return (
		<>
			<SignedIn>
				<div className="container max-w-screen-lg py-8 px-4">
					<div className="mb-8">
						<h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
							<Key className="h-8 w-8 text-[#1DA1F2]" />
							API Tokens
						</h1>
						<p className="text-muted-foreground mt-1">
							Gere tokens para agentes de IA e integracoes
						</p>
					</div>

					<div className="space-y-6">
						{/* Token Created Alert */}
						{createdToken && (
							<Alert
								variant="default"
								className="border-green-500/50 bg-green-500/10"
							>
								<AlertTriangle className="h-4 w-4 text-green-500" />
								<AlertTitle className="text-green-500">
									Token criado!
								</AlertTitle>
								<AlertDescription>
									<p className="mb-3">
										Copie o token agora. Ele nao sera exibido novamente.
									</p>
									<div className="flex items-center gap-2">
										<code className="flex-1 bg-background/50 px-3 py-2 rounded-md font-mono text-sm break-all">
											{createdToken.token}
										</code>
										<Button
											variant="outline"
											size="icon"
											onClick={handleCopyToken}
											className="shrink-0"
										>
											{copied ? (
												<Check className="h-4 w-4 text-green-500" />
											) : (
												<Copy className="h-4 w-4" />
											)}
										</Button>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={handleDismissToken}
										className="mt-3"
									>
										Fechar
									</Button>
								</AlertDescription>
							</Alert>
						)}

						{/* Create Token Form */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Shield className="h-5 w-5 text-[#1DA1F2]" />
									Criar Novo Token
								</CardTitle>
								<CardDescription>
									Defina uma descricao, permissoes e validade opcional
								</CardDescription>
							</CardHeader>

							<form onSubmit={handleCreateToken}>
								<CardContent className="space-y-6">
									{/* Description */}
									<div className="space-y-2">
										<Label htmlFor={descriptionId}>Descricao *</Label>
										<Input
											id={descriptionId}
											placeholder="Ex: Agente de criacao de tweets"
											value={description}
											onChange={(e) => setDescription(e.target.value)}
											maxLength={100}
										/>
										<p className="text-xs text-muted-foreground">
											{description.length}/100 caracteres
										</p>
									</div>

									{/* Permissions */}
									<div className="space-y-4">
										<Label>Permissoes *</Label>

										{/* Drafts permissions */}
										<div className="space-y-2">
											<p className="text-sm font-medium text-muted-foreground">
												Rascunhos
											</p>
											<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
												{PERMISSIONS.drafts.map((perm) => (
													<div
														key={perm.value}
														className="flex items-center space-x-2"
													>
														<Checkbox
															id={perm.value}
															checked={selectedPermissions.includes(perm.value)}
															onCheckedChange={(checked) =>
																handlePermissionChange(
																	perm.value,
																	checked as boolean,
																)
															}
														/>
														<Label
															htmlFor={perm.value}
															className="text-sm font-normal cursor-pointer"
														>
															{perm.label}
														</Label>
													</div>
												))}
											</div>
										</div>

										{/* Tokens permissions */}
										<div className="space-y-2">
											<p className="text-sm font-medium text-muted-foreground">
												Tokens
											</p>
											<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
												{PERMISSIONS.tokens.map((perm) => (
													<div
														key={perm.value}
														className="flex items-center space-x-2"
													>
														<Checkbox
															id={perm.value}
															checked={selectedPermissions.includes(perm.value)}
															onCheckedChange={(checked) =>
																handlePermissionChange(
																	perm.value,
																	checked as boolean,
																)
															}
														/>
														<Label
															htmlFor={perm.value}
															className="text-sm font-normal cursor-pointer"
														>
															{perm.label}
														</Label>
													</div>
												))}
											</div>
										</div>
									</div>

									{/* Expiration */}
									<div className="space-y-2">
										<Label htmlFor={expiresId}>Validade (opcional)</Label>
										<div className="flex items-center gap-2">
											<Input
												id={expiresId}
												type="number"
												placeholder="30"
												value={expiresInDays}
												onChange={(e) => setExpiresInDays(e.target.value)}
												min="1"
												max="365"
												className="w-24"
											/>
											<span className="text-sm text-muted-foreground">
												dias
											</span>
										</div>
										<p className="text-xs text-muted-foreground">
											Deixe em branco para token sem validade
										</p>
									</div>
								</CardContent>

								<CardFooter className="border-t pt-6">
									<Button
										type="submit"
										disabled={
											isCreating ||
											!description.trim() ||
											selectedPermissions.length === 0
										}
										className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90"
									>
										{isCreating ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Gerando...
											</>
										) : (
											<>
												<Key className="h-4 w-4 mr-2" />
												Gerar Token
											</>
										)}
									</Button>
								</CardFooter>
							</form>
						</Card>

						{/* Existing Tokens List */}
						<Card>
							<CardHeader>
								<CardTitle>Tokens Existentes</CardTitle>
								<CardDescription>Gerencie seus tokens de API</CardDescription>
							</CardHeader>

							<CardContent>
								{isLoadingTokens ? (
									<div className="flex items-center justify-center py-8">
										<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
									</div>
								) : tokens && tokens.length > 0 ? (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Prefixo</TableHead>
												<TableHead>Descricao</TableHead>
												<TableHead>Permissoes</TableHead>
												<TableHead>Criado</TableHead>
												<TableHead>Ultimo Uso</TableHead>
												<TableHead>Expira</TableHead>
												<TableHead className="text-right">Acoes</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{tokens.map((token) => (
												<TableRow key={token._id}>
													<TableCell className="font-mono text-sm">
														{token.prefix}
													</TableCell>
													<TableCell>{token.description}</TableCell>
													<TableCell>
														<div className="flex flex-wrap gap-1">
															{token.permissions.slice(0, 2).map((perm) => (
																<Badge
																	key={perm}
																	variant="secondary"
																	className="text-xs"
																>
																	{perm.split(":")[1]}
																</Badge>
															))}
															{token.permissions.length > 2 && (
																<Badge variant="outline" className="text-xs">
																	+{token.permissions.length - 2}
																</Badge>
															)}
														</div>
													</TableCell>
													<TableCell className="text-sm text-muted-foreground">
														{formatRelativeDate(token.createdAt)}
													</TableCell>
													<TableCell className="text-sm text-muted-foreground">
														{token.lastUsedAt
															? formatRelativeDate(token.lastUsedAt)
															: "Nunca"}
													</TableCell>
													<TableCell className="text-sm text-muted-foreground">
														{token.expiresAt
															? formatDate(token.expiresAt)
															: "Nunca"}
													</TableCell>
													<TableCell className="text-right">
														<AlertDialog>
															<AlertDialogTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	className="text-destructive hover:text-destructive hover:bg-destructive/10"
																	disabled={isRevoking}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Revogar Token
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Tem certeza que deseja revogar o token{" "}
																		<code className="font-mono bg-muted px-1 rounded">
																			{token.prefix}
																		</code>
																		? Esta acao nao pode ser desfeita.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>
																		Cancelar
																	</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() =>
																			revokeToken({ prefix: token.prefix })
																		}
																		className="bg-destructive text-white hover:bg-destructive/90"
																	>
																		Revogar
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								) : (
									<div className="text-center py-8 text-muted-foreground">
										<Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
										<p>Nenhum token criado ainda</p>
										<p className="text-sm">Crie seu primeiro token acima</p>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</SignedIn>
			<SignedOut>
				<div className="container max-w-screen-2xl py-8 px-4 flex items-center justify-center min-h-[60vh]">
					<Card className="w-full max-w-md">
						<CardHeader className="text-center">
							<CardTitle>Acesso Restrito</CardTitle>
							<CardDescription>
								Faca login para gerenciar tokens de API
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
