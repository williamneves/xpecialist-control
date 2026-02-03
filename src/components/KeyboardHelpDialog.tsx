import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface KeyboardHelpDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
	id: string;
	keys: string[];
	description: string;
}

const shortcuts: ShortcutItem[] = [
	{ id: "approve", keys: ["Alt", "A", "(2x)"], description: "Aprovar" },
	{
		id: "quick-reject",
		keys: ["Alt", "R", "(2x)"],
		description: "Rejeitar rapidamente",
	},
	{
		id: "reject-reason",
		keys: ["Alt", "R", "+", "Alt", "Y"],
		description: "Rejeitar com motivo",
	},
	{ id: "edit", keys: ["Alt", "E"], description: "Editar" },
	{ id: "next", keys: ["J"], description: "Proximo draft" },
	{ id: "prev", keys: ["K"], description: "Draft anterior" },
	{ id: "help", keys: ["?"], description: "Ajuda" },
	{ id: "close", keys: ["Esc"], description: "Fechar" },
];

function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="bg-muted px-2 py-1 rounded border text-xs font-mono">
			{children}
		</kbd>
	);
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutItem }) {
	return (
		<div className="flex items-center justify-between py-2">
			<div className="flex items-center gap-1">
				{shortcut.keys.map((key, idx) => {
					// Use index in key since same key can appear multiple times (e.g., Alt+R+Alt+Y)
					const uniqueKey = `${shortcut.id}-${idx}-${key}`;
					// Don't wrap operators like "+" or "(2x)" in kbd
					if (key === "+" || key.startsWith("(")) {
						return (
							<span
								key={uniqueKey}
								className="text-muted-foreground text-xs mx-1"
							>
								{key}
							</span>
						);
					}
					return <Kbd key={uniqueKey}>{key}</Kbd>;
				})}
			</div>
			<span className="text-sm text-muted-foreground">
				{shortcut.description}
			</span>
		</div>
	);
}

export function KeyboardHelpDialog({
	open,
	onOpenChange,
}: KeyboardHelpDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Atalhos de Teclado</DialogTitle>
					<DialogDescription>
						Use estes atalhos para navegar e revisar drafts rapidamente.
					</DialogDescription>
				</DialogHeader>

				<div className="divide-y">
					{shortcuts.map((shortcut) => (
						<ShortcutRow key={shortcut.id} shortcut={shortcut} />
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
