import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Supabase автоматически обрабатывает хеш с токенами при загрузке страницы,
      // если библиотека инициализирована.

      // 1. Проверяем наличие ошибок в URL (например, expired link)
      const hash = window.location.hash
      const params = new URLSearchParams(window.location.search)
      const errorFromUrl = params.get('error') || new URLSearchParams(hash.substring(1)).get('error')

      if (errorFromUrl) {
        const errorDescription = params.get('error_description') || new URLSearchParams(hash.substring(1)).get('error_description')
        setErrorMessage(errorDescription || 'Ошибка аутентификации')
        setStatus('error')
        toast.error('Ошибка подтверждения: ' + errorDescription)
        return
      }

      // 2. Обработка PKCE (если в URL есть ?code=...)
      const code = params.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setErrorMessage(error.message)
          setStatus('error')
          toast.error('Ошибка обмена кода: ' + error.message)
          return
        }
      }

      // 3. Получаем сессию (она могла установиться автоматически из хеша или через exchangeCodeForSession)
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        setErrorMessage(error.message)
        setStatus('error')
        toast.error('Ошибка сессии: ' + error.message)
        return
      }

      if (session) {
        setStatus('success')
        toast.success('Энергия синхронизирована. Добро пожаловать в сеть Nodes.')
        // Маленькая задержка для визуального эффекта
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } else {
        // Если сессии нет, возможно это просто переход на страницу без данных
        // Или Supabase еще обрабатывает. Дадим время.
        setTimeout(async () => {
          const { data: { session: secondTry } } = await supabase.auth.getSession()
          if (secondTry) {
            setStatus('success')
            navigate('/')
          } else {
            setErrorMessage('Сессия не найдена. Попробуйте войти еще раз.')
            setStatus('error')
          }
        }, 1500)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Фоновые "импульсы" для атмосферы */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-primary/20 bg-background/80 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
            {status === 'loading' && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
            {status === 'success' && <div className="w-4 h-4 bg-primary rounded-full animate-ping" />}
            {status === 'error' && <div className="text-destructive text-2xl font-bold">!</div>}
          </div>
          <CardTitle className="text-2xl tracking-tight">
            {status === 'loading' && 'Синхронизация узла...'}
            {status === 'success' && 'Соединение установлено'}
            {status === 'error' && 'Ошибка подключения'}
          </CardTitle>
          <CardDescription className="mt-2 text-muted-foreground/80">
            {status === 'loading' && 'Устанавливаем безопасный канал связи с вашей нейронной сетью...'}
            {status === 'success' && 'Ваша личность подтверждена. Перенаправляем в интерфейс управления.'}
            {status === 'error' && (errorMessage || 'Не удалось подтвердить email. Ссылка могла устареть.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status === 'error' && (
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
            >
              Вернуться ко входу
            </button>
          )}
          {status === 'loading' && (
            <div className="w-full h-1 bg-muted overflow-hidden rounded-full">
              <div className="h-full bg-primary animate-progress-flow" />
            </div>
          )}
        </CardContent>
      </Card>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes progress-flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress-flow {
          animation: progress-flow 2s infinite ease-in-out;
        }
      `}} />
    </div>
  )
}
