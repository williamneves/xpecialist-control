import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'
import { useState, useMemo } from 'react'
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Twitter,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import DraftDetailSheet from '@/components/DraftDetailSheet'

export const Route = createFileRoute('/drafts/history')({ component: DraftsHistory })

type Draft = Doc<'drafts'>
type DraftStatus = Draft['status']

const statusConfig = {
  pending: { label: 'Pendente', variant: 'outline' as const, icon: Clock },
  approved: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle },
  rejected: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
  scheduled: { label: 'Agendado', variant: 'secondary' as const, icon: Calendar },
  published: { label: 'Publicado', variant: 'default' as const, icon: Twitter },
}

const statusOptions: { value: DraftStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'approved', label: 'Aprovados' },
  { value: 'rejected', label: 'Rejeitados' },
  { value: 'scheduled', label: 'Agendados' },
  { value: 'published', label: 'Publicados' },
]

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

function truncateContent(content: string, maxLength = 80) {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '...'
}

function DraftsHistory() {
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<DraftStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const queryStatus = statusFilter === 'all' ? undefined : statusFilter

  const { data: drafts, isLoading, refetch, isRefetching } = useQuery(
    convexQuery(api.drafts.listAll, { status: queryStatus })
  )

  const filteredDrafts = useMemo(() => {
    if (!drafts) return []
    if (!searchQuery.trim()) return drafts

    const query = searchQuery.toLowerCase()
    return drafts.filter(
      (draft) =>
        draft.content.toLowerCase().includes(query) ||
        draft.authorName?.toLowerCase().includes(query) ||
        draft.metadata?.tags?.some((tag) => tag.toLowerCase().includes(query))
    )
  }, [drafts, searchQuery])

  const handleRowClick = (draft: Draft) => {
    setSelectedDraft(draft)
    setSheetOpen(true)
  }

  const handleSheetClose = (open: boolean) => {
    setSheetOpen(open)
    if (!open) {
      setTimeout(() => setSelectedDraft(null), 300)
    }
  }

  const stats = useMemo(() => {
    if (!drafts) return { pending: 0, approved: 0, rejected: 0, published: 0 }
    return {
      pending: drafts.filter((d) => d.status === 'pending').length,
      approved: drafts.filter((d) => d.status === 'approved').length,
      rejected: drafts.filter((d) => d.status === 'rejected').length,
      published: drafts.filter((d) => d.status === 'published').length,
    }
  }, [drafts])

  return (
    <>
      <SignedIn>
        <div className="container max-w-screen-2xl py-8 px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Historico</h1>
              <p className="text-muted-foreground mt-1">
                Visualize todos os drafts criados
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-yellow-500/10 p-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-500/10 p-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.approved}</p>
                    <p className="text-sm text-muted-foreground">Aprovados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-500/10 p-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.rejected}</p>
                    <p className="text-sm text-muted-foreground">Rejeitados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#1DA1F2]/10 p-2">
                    <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.published}</p>
                    <p className="text-sm text-muted-foreground">Publicados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1DA1F2]" />
                Todos os Drafts
              </CardTitle>
              <CardDescription>
                {filteredDrafts.length} draft(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por conteudo, autor ou tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as DraftStatus | 'all')
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ) : filteredDrafts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[45%]">Conteudo</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrafts.map((draft) => {
                      const status = statusConfig[draft.status]
                      const StatusIcon = status.icon
                      return (
                        <TableRow
                          key={draft._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(draft)}
                        >
                          <TableCell className="font-medium">
                            <p className="line-clamp-2">{truncateContent(draft.content)}</p>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {draft.authorName || 'Desconhecido'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {draft.metadata?.type || 'single'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(draft.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">Nenhum draft encontrado</h3>
                  <p className="text-muted-foreground mt-1 max-w-sm">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Tente ajustar os filtros de busca.'
                      : 'Crie seu primeiro draft para comecar.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <DraftDetailSheet
            draft={selectedDraft}
            open={sheetOpen}
            onOpenChange={handleSheetClose}
          />
        </div>
      </SignedIn>
      <SignedOut>
        <div className="container max-w-screen-2xl py-8 px-4 flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Acesso Restrito</CardTitle>
              <CardDescription>Faca login para acessar o dashboard</CardDescription>
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
  )
}
