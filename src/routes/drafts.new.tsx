import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { useUser, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { api } from '../../convex/_generated/api'
import { useState } from 'react'
import { toast } from 'sonner'
import { PenLine, Send, X, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageContainer } from '@/components/PageContainer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/drafts/new')({ component: NewDraft })

const toneOptions = [
  { value: 'professional', label: 'Profissional' },
  { value: 'casual', label: 'Casual' },
  { value: 'educational', label: 'Educativo' },
  { value: 'promotional', label: 'Promocional' },
  { value: 'inspirational', label: 'Inspiracional' },
]

function NewDraft() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [content, setContent] = useState('')
  const [type, setType] = useState<'single' | 'thread'>('single')
  const [tone, setTone] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const { mutate: createDraft, isPending } = useMutation({
    mutationFn: useConvexMutation(api.drafts.create),
    onSuccess: () => {
      toast.success('Draft criado com sucesso!')
      navigate({ to: '/' })
    },
    onError: (error) => {
      toast.error(`Erro ao criar draft: ${error.message}`)
    },
  })

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error('O conteúdo do draft é obrigatório')
      return
    }

    if (content.length > 280) {
      toast.error('O conteúdo excede o limite de 280 caracteres')
      return
    }

    createDraft({
      content: content.trim(),
      authorId: user?.id || 'anonymous',
      authorName: user?.fullName || user?.username || undefined,
      metadata: {
        type,
        tone: tone || undefined,
        tags: tags.length > 0 ? tags : undefined,
      },
    })
  }

  const charCount = content.length
  const isOverLimit = charCount > 280
  const charCountColor = isOverLimit
    ? 'text-destructive'
    : charCount > 260
      ? 'text-yellow-500'
      : 'text-muted-foreground'

  return (
    <>
      <SignedIn>
        <PageContainer>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Novo Draft</h1>
            <p className="text-muted-foreground mt-1">
              Crie um novo draft para revisao
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenLine className="h-5 w-5 text-[#1DA1F2]" />
                  Conteudo do Draft
                </CardTitle>
                <CardDescription>
                  Escreva o conteudo que sera publicado no Twitter/X
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Conteudo *</Label>
                  <Textarea
                    id="content"
                    placeholder="O que voce quer compartilhar?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-32 resize-none"
                  />
                  <div className="flex justify-end">
                    <span className={`text-sm ${charCountColor}`}>
                      {charCount}/280
                    </span>
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={type}
                    onValueChange={(value: 'single' | 'thread') => setType(value)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Tweet Unico</SelectItem>
                      <SelectItem value="thread">Thread</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label htmlFor="tone">Tom (opcional)</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger id="tone">
                      <SelectValue placeholder="Selecione o tom" />
                    </SelectTrigger>
                    <SelectContent>
                      {toneOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      placeholder="Adicionar tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 cursor-pointer hover:bg-destructive/20"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate({ to: '/' })}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !content.trim() || isOverLimit}
                  className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Criar Draft
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </PageContainer>
      </SignedIn>
      <SignedOut>
        <PageContainer className="flex items-center justify-center min-h-[60vh]">
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
        </PageContainer>
      </SignedOut>
    </>
  )
}
