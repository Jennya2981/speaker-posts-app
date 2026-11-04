'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { AlignLeft, ArrowDownWideNarrow, Check, CheckCircle2, Copy, FileText, FilterX, Hash, Heading1, Loader2, Megaphone, PenLine, Pencil, Plus, Send, Trash2, UserRound, X } from 'lucide-react'

const TELEGRAM_BLUE = 'bg-[#229ED9] hover:bg-[#1d8ec4] text-white'
const PRIMARY_BLUE = 'bg-[#4338CA] hover:bg-[#3730A3] text-white'

type CopyField = 'all' | 'title' | 'content' | 'hashtags' | 'telegram'

type Speaker = { id: string; name: string }
type Post = {
  id: string
  title: string
  content: string
  hashtags: string
  status: string
  speakerId: string | null
  speaker: { name: string } | null
  createdAt: string
}
type SortBy = 'new' | 'speakerAsc' | 'speakerDesc'

export default function Home() {
  const { toast } = useToast()
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [speakerId, setSpeakerId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newSpeaker, setNewSpeaker] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [copied, setCopied] = useState<{ id: string; field: CopyField } | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [editing, setEditing] = useState<Post | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('new')
  const [filterSpeakerId, setFilterSpeakerId] = useState('all')

  const loadSpeakers = useCallback(async () => {
    const res = await fetch('/api/speakers')
    if (res.ok) setSpeakers(await res.json())
  }, [])

  const loadPosts = useCallback(async () => {
    const res = await fetch('/api/posts')
    if (res.ok) setPosts(await res.json())
  }, [])

  useEffect(() => {
    Promise.all([loadSpeakers(), loadPosts()]).finally(() => setLoading(false))
  }, [loadSpeakers, loadPosts])

  const resetForm = () => {
    setSpeakerId('')
    setTitle('')
    setContent('')
    setHashtags('')
  }

  const handleSubmit = async (status: 'PUBLISHED' | 'DRAFT') => {
    if (!title.trim()) {
      toast({ title: 'Заполните заголовок', description: 'Пост не может быть без заголовка.', variant: 'destructive' })
      return
    }
    if (!content.trim()) {
      toast({ title: 'Заполните текст поста', variant: 'destructive' })
      return
    }
    const effectiveStatus = editing ? editing.status : status
    if (effectiveStatus === 'PUBLISHED' && !speakerId) {
      toast({ title: 'Выберите автора', description: 'Выберите спикера, от имени которого публикуется пост.', variant: 'destructive' })
      return
    }

    setSending(true)
    try {
      if (editing) {
        const res = await fetch(`/api/posts/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, hashtags, speakerId: speakerId || null }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Ошибка сохранения')
        }
        toast({ title: 'Изменения сохранены', description: `«${title.trim()}» обновлён.` })
        setEditing(null)
        resetForm()
      } else {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, hashtags, speakerId, status }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Ошибка сохранения')
        }
        if (status === 'PUBLISHED') {
          setSubmitted(true)
          toast({ title: 'Пост отправлен!', description: `«${title.trim()}» опубликован.` })
        } else {
          toast({ title: 'Черновик сохранён', description: 'Вы можете вернуться к нему позже.' })
          resetForm()
        }
      }
      await loadPosts()
    } catch (e) {
      toast({ title: 'Ошибка', description: e instanceof Error ? e.message : 'Попробуйте ещё раз', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const handleCancel = () => {
    if (editing) {
      setEditing(null)
      resetForm()
      toast({ title: 'Редактирование отменено' })
    } else {
      resetForm()
      toast({ title: 'Форма очищена' })
    }
  }

  const openEdit = (post: Post) => {
    setEditing(post)
    setSpeakerId(post.speakerId ?? '')
    setTitle(post.title)
    setContent(post.content)
    setHashtags(post.hashtags)
    setSelectedPost(null)
    setSubmitted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const copyToClipboard = async (text: string, postId: string, field: CopyField) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      const labels: Record<CopyField, string> = {
        all: 'Пост скопирован',
        title: 'Заголовок скопирован',
        content: 'Текст скопирован',
        hashtags: 'Хештеги скопированы',
        telegram: 'Скопировано для Telegram',
      }
      toast({ title: labels[field], description: 'Вставьте текст в соцсети (Ctrl+V / \u2318+V)' })
      setCopied({ id: postId, field })
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast({ title: 'Не удалось скопировать', description: 'Выделите текст вручную и скопируйте.', variant: 'destructive' })
    }
  }

  const buildFullPostText = (post: Post) =>
    [post.title, post.content, post.hashtags].filter(Boolean).join('\n\n')

  const buildTelegramText = (post: Post) =>
    [post.content, post.hashtags].filter(Boolean).join('\n\n')

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPosts((p) => p.filter((x) => x.id !== id))
      toast({ title: 'Пост удалён' })
    }
  }

  const handlePublishDraft = async (id: string) => {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PUBLISHED' }),
    })
    if (res.ok) {
      await loadPosts()
      toast({ title: 'Черновик опубликован' })
    }
  }

  const handleAddSpeaker = async () => {
    const name = newSpeaker.trim()
    if (!name) return
    const res = await fetch('/api/speakers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const speaker: Speaker = await res.json()
      await loadSpeakers()
      setSpeakerId(speaker.id)
      setNewSpeaker('')
      setAddDialogOpen(false)
      toast({ title: 'Спикер добавлен', description: name })
    }
  }

  const publishedCount = posts.filter((p) => p.status === 'PUBLISHED').length
  const draftCount = posts.length - publishedCount

  const sortedPosts = useMemo(() => {
    const arr = filterSpeakerId === 'all'
      ? [...posts]
      : posts.filter((p) => p.speakerId === filterSpeakerId)
    if (sortBy === 'speakerAsc') {
      arr.sort((a, b) => (a.speaker?.name ?? 'Я').localeCompare(b.speaker?.name ?? 'Я', 'ru'))
    } else if (sortBy === 'speakerDesc') {
      arr.sort((a, b) => (b.speaker?.name ?? 'Я').localeCompare(a.speaker?.name ?? 'Я', 'ru'))
    }
    return arr
  }, [posts, sortBy, filterSpeakerId])

  const filteredSpeakerName = speakers.find((s) => s.id === filterSpeakerId)?.name

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 to-stone-100">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4338CA] text-white shrink-0">
            <Megaphone className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Сбор постов от спикеров</h1>
            <p className="text-sm text-muted-foreground">Отправьте пост от имени спикера или сохраните черновик</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-6">
        {submitted ? (
          <Card className="border-[#C7D2FE]">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <CheckCircle2 className="h-14 w-14 text-[#4338CA]" aria-hidden />
              <div>
                <h2 className="text-xl font-semibold">Пост отправлен!</h2>
                <p className="mt-1 text-sm text-muted-foreground">Материал сохранён и передан в работу.</p>
              </div>
              <Button size="lg" onClick={() => { setSubmitted(false); resetForm() }}>
                <PenLine className="mr-2 h-4 w-4" aria-hidden />
                Создать ещё пост
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editing && <Pencil className="h-4 w-4 text-amber-600" aria-hidden />}
                {editing ? 'Редактирование поста' : 'Новый пост'}
              </CardTitle>
              <CardDescription>
                {editing
                  ? `Измените поля и нажмите «Сохранить изменения» — статус «${editing.status === 'DRAFT' ? 'черновик' : 'опубликован'}» сохранится.`
                  : 'Заполните поля и отправьте пост или сохраните его как черновик'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="speaker">От чьего имени пост</Label>
                <div className="flex gap-2">
                  <Select value={speakerId} onValueChange={setSpeakerId}>
                    <SelectTrigger id="speaker" className="w-full" aria-label="Автор поста">
                      <span className="flex items-center gap-2 truncate">
                        <UserRound className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                        <SelectValue placeholder="Выберите спикера" />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {speakers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="shrink-0" aria-label="Добавить спикера">
                        <Plus className="h-4 w-4" aria-hidden />
                        <span className="hidden sm:inline">Добавить</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Новый спикер</DialogTitle>
                        <DialogDescription>Добавьте спикера, от имени которого будут публиковаться посты.</DialogDescription>
                      </DialogHeader>
                      <Input
                        value={newSpeaker}
                        onChange={(e) => setNewSpeaker(e.target.value)}
                        placeholder="Имя и фамилия"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddSpeaker() }}
                        autoFocus
                      />
                      <DialogFooter>
                        <Button onClick={handleAddSpeaker} disabled={!newSpeaker.trim()}>Добавить</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Заголовок поста</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Главное с конференции" maxLength={120} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Текст поста</Label>
                <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="О чём расскажем? Мысли, тезисы, впечатления…" rows={7} />
                <p className="text-xs text-muted-foreground text-right">{content.length} символов</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hashtags">Хештеги</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input id="hashtags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="pl-9" placeholder="конференция2026, итоги, IT" />
                </div>
                <p className="text-xs text-muted-foreground">Через запятую или пробел — символ # добавится автоматически</p>
              </div>

              <Separator />

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={handleCancel} disabled={sending}>
                  <X className="mr-2 h-4 w-4" aria-hidden />
                  {editing ? 'Отменить правку' : 'Отменить'}
                </Button>
                {!editing && (
                  <Button variant="outline" onClick={() => handleSubmit('DRAFT')} disabled={sending}>
                    <FileText className="mr-2 h-4 w-4" aria-hidden />
                    Черновик
                  </Button>
                )}
                {editing ? (
                  <Button onClick={() => handleSubmit('PUBLISHED')} disabled={sending} className={PRIMARY_BLUE}>
                    {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Check className="mr-2 h-4 w-4" aria-hidden />}
                    Сохранить изменения
                  </Button>
                ) : (
                  <Button onClick={() => handleSubmit('PUBLISHED')} disabled={sending} className={PRIMARY_BLUE}>
                    {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Send className="mr-2 h-4 w-4" aria-hidden />}
                    Отправить
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <section aria-labelledby="posts-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="posts-heading" className="text-base font-semibold">Все посты</h2>
              <p className="text-xs text-muted-foreground">Нажмите на пост, чтобы открыть его полный текст</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={String(filterSpeakerId)} onValueChange={setFilterSpeakerId}>
                <SelectTrigger className="h-9 w-[210px]" aria-label="Фильтр по спикеру">
                  <span className="flex items-center gap-2 text-sm truncate">
                    <UserRound className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все спикеры</SelectItem>
                  {speakers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterSpeakerId !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setFilterSpeakerId('all')}
                  aria-label="Очистить фильтр"
                >
                  <FilterX className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Сбросить фильтр
                </Button>
              )}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="h-9 w-[220px]" aria-label="Сортировка постов">
                  <span className="flex items-center gap-2 text-sm">
                    <ArrowDownWideNarrow className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Сначала новые</SelectItem>
                  <SelectItem value="speakerAsc">По спикеру: А \u2192 Я</SelectItem>
                  <SelectItem value="speakerDesc">По спикеру: Я \u2192 А</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Опубликовано: {publishedCount}</Badge>
              <Badge variant="secondary" className="bg-[#E0E7FF] text-[#4338CA]">Черновики: {draftCount}</Badge>
            </div>
          </div>
          {filterSpeakerId !== 'all' && (
            <p className="text-xs text-muted-foreground">
              Показаны посты спикера: <span className="font-medium text-foreground">{filteredSpeakerName}</span> \u00b7 найдено {sortedPosts.length}
            </p>
          )}

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden /></div>
          ) : sortedPosts.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
              {filterSpeakerId !== 'all'
                ? <>У спикера «{filteredSpeakerName}» пока нет постов.</>
                : 'Пока нет ни одного поста — создайте первый!'}
            </CardContent></Card>
          ) : (
            <ul className="space-y-3">
              {sortedPosts.map((post) => (
                <li key={post.id}>
                  <Card
                    role="button"
                    tabIndex={0}
                    aria-label={`Открыть пост: ${post.title}`}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA]"
                    onClick={() => setSelectedPost(post)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedPost(post)
                      }
                    }}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={post.status === 'DRAFT' ? 'bg-[#818CF8] text-white' : 'bg-emerald-600 text-white'}>{post.status === 'DRAFT' ? 'Черновик' : 'Опубликован'}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {post.speaker ? post.speaker.name : 'Без автора'} \u00b7 {new Date(post.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h3 className="mt-2 font-semibold leading-snug break-words">{post.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 break-words">{post.content}</p>
                          {post.hashtags && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {post.hashtags.split(' ').slice(0, 4).map((tag) => (
                                <span key={tag} className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {post.status === 'DRAFT' && (
                            <Button size="sm" className={PRIMARY_BLUE} onClick={(e) => { e.stopPropagation(); handlePublishDraft(post.id) }}>Опубликовать</Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); openEdit(post) }}
                            aria-label="Редактировать пост"
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(post.id) }}
                            aria-label="Удалить пост"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Dialog open={!!selectedPost} onOpenChange={(open) => { if (!open) setSelectedPost(null) }}>
          {selectedPost && (
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader className="text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={selectedPost.status === 'DRAFT' ? 'bg-[#818CF8] text-white' : 'bg-emerald-600 text-white'}>{selectedPost.status === 'DRAFT' ? 'Черновик' : 'Опубликован'}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedPost.speaker ? selectedPost.speaker.name : 'Без автора'} \u00b7 {new Date(selectedPost.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <DialogTitle className="text-xl leading-snug break-words">{selectedPost.title}</DialogTitle>
                <DialogDescription className="sr-only">Полный текст поста. Кнопка ниже копирует его целиком.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Полный текст поста</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words select-all">{selectedPost.content}</p>
                {selectedPost.hashtags && (
                  <div className="flex flex-wrap gap-1.5 select-all">
                    {selectedPost.hashtags.split(' ').map((tag) => (
                      <span key={tag} className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch sm:space-x-0">
                <Button
                  className={TELEGRAM_BLUE}
                  onClick={() => copyToClipboard(buildTelegramText(selectedPost), selectedPost.id, 'telegram')}
                >
                  {copied?.id === selectedPost.id && copied.field === 'telegram'
                    ? <Check className="mr-2 h-4 w-4" aria-hidden />
                    : <Send className="mr-2 h-4 w-4" aria-hidden />}
                  Копировать для Telegram (текст + хештеги)
                </Button>
                <Button
                  className={PRIMARY_BLUE}
                  onClick={() => copyToClipboard(buildFullPostText(selectedPost), selectedPost.id, 'all')}
                >
                  {copied?.id === selectedPost.id && copied.field === 'all'
                    ? <Check className="mr-2 h-4 w-4" aria-hidden />
                    : <Copy className="mr-2 h-4 w-4" aria-hidden />}
                  Копировать весь пост с заголовком
                </Button>
                <div className="flex flex-wrap justify-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(selectedPost)} aria-label="Редактировать пост">
                    <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Редактировать
                  </Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => copyToClipboard(selectedPost.title, selectedPost.id, 'title')} aria-label="Копировать заголовок">
                    {copied?.id === selectedPost.id && copied.field === 'title'
                      ? <Check className="mr-1.5 h-3.5 w-3.5 text-[#4338CA]" aria-hidden />
                      : <Heading1 className="mr-1.5 h-3.5 w-3.5" aria-hidden />}
                    Заголовок
                  </Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => copyToClipboard(selectedPost.content, selectedPost.id, 'content')} aria-label="Копировать текст">
                    {copied?.id === selectedPost.id && copied.field === 'content'
                      ? <Check className="mr-1.5 h-3.5 w-3.5 text-[#4338CA]" aria-hidden />
                      : <AlignLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden />}
                    Текст
                  </Button>
                  {selectedPost.hashtags && (
                    <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => copyToClipboard(selectedPost.hashtags, selectedPost.id, 'hashtags')} aria-label="Копировать хештеги">
                      {copied?.id === selectedPost.id && copied.field === 'hashtags'
                        ? <Check className="mr-1.5 h-3.5 w-3.5 text-[#4338CA]" aria-hidden />
                        : <Hash className="mr-1.5 h-3.5 w-3.5" aria-hidden />}
                      Хештеги
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </main>

      <footer className="mt-auto border-t bg-white/70">
        <div className="mx-auto max-w-3xl px-4 py-3 text-center text-xs text-muted-foreground">
          Сбор постов от спикеров \u00b7 {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}