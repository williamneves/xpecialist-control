import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'
import { useState } from 'react'
import { FileText, Clock, CheckCircle, XCircle, Calendar, RefreshCw } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DraftDetailSheet from '@/components/DraftDetailSheet'

export const Route = createFileRoute('/')({ component: Dashboard })

type Draft = Doc<'drafts'>

const statusConfig = {
  pending: { label: 'Pendente', variant: 'outline' as const, icon: Clock },
  approved: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle },
  rejected: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
  scheduled: { label: 'Agendado', variant: 'secondary' as const, icon: Calendar },
  published: { label: 'Publicado', variant: 'default' as const, icon: FileText },
}

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

function Dashboard() {
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: drafts, isLoading, refetch, isRefetching } = useQuery(
    convexQuery(api.drafts.listPending, {})
  )

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

  return (
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
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#1DA1F2]" />
            Drafts Pendentes
          </CardTitle>
          <CardDescription>
            {drafts?.length ?? 0} draft(s) aguardando revisão
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : drafts && drafts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Conteúdo</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => {
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
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhum draft pendente</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Todos os drafts foram revisados. Novos drafts aparecerão aqui quando forem criados.
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
  )
}
