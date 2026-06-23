import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth.service'
import { useTranslation } from 'react-i18next'

export default function AuthCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'error' | 'success' | 'recovery'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const handleAuth = async () => {
      const result = await authService.handleAuthCallback();

      if (result.type === 'error') {
        setErrorMessage(result.message || t('auth.callback.unknown_error', 'Произошла ошибка'));
        setStatus('error');
        toast.error(t('auth.callback.error_prefix', 'Ошибка: ') + result.message);
        return;
      }

      if (result.type === 'recovery') {
        setStatus('recovery');
        toast.info(t('auth.callback.recovery_hint', 'Пожалуйста, введите новый пароль'));
        return;
      }

      if (result.type === 'success') {
        setStatus('success');
        toast.success(t('auth.callback.welcome', 'Данные синхронизированы. Добро пожаловать.'));
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      if (result.type === 'loading') {
        // Если через 3 секунды всё еще loading, значит что-то пошло не так
        const timer = setTimeout(() => {
          setStatus('error');
          setErrorMessage(t('auth.callback.timeout_error', 'Время ожидания истекло. Попробуйте войти снова.'));
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    handleAuth();
  }, [navigate, t]);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }

    setIsUpdating(true)
    try {
      const { error } = await authService.updatePassword(newPassword)
      if (error) throw error
      
      toast.success(t('auth.callback.password_updated_success', 'Пароль успешно обновлен!'))
      setStatus('success')
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('auth.callback.password_update_error', 'Ошибка при обновлении пароля');
      toast.error(msg)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-primary/20 bg-background/80 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
            {status === 'loading' && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
            {status === 'success' && <div className="w-4 h-4 bg-primary rounded-full animate-ping" />}
            {status === 'error' && <div className="text-destructive text-2xl font-bold">!</div>}
            {status === 'recovery' && <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse" />}
          </div>
          <CardTitle className="text-2xl tracking-tight">
            {status === 'loading' && t('auth.callback.syncing', 'Синхронизация узла...')}
            {status === 'success' && t('auth.callback.connection_established', 'Соединение установлено')}
            {status === 'error' && t('auth.callback.connection_error', 'Ошибка подключения')}
            {status === 'recovery' && t('auth.callback.password_reset', 'Сброс пароля')}
          </CardTitle>
          <CardDescription className="mt-2 text-muted-foreground/80">
            {status === 'loading' && t('auth.callback.loading_desc', 'Устанавливаем безопасный канал связи с вашей нейронной сетью...')}
            {status === 'success' && t('auth.callback.success_desc', 'Ваша личность подтверждена. Перенаправляем в интерфейс управления.')}
            {status === 'error' && (errorMessage || t('auth.callback.error_desc', 'Не удалось подтвердить email. Ссылка могла устареть.'))}
            {status === 'recovery' && t('auth.callback.recovery_desc', 'Придумайте новый ключ доступа для вашей системы.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status === 'error' && (
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
            >
              {t('auth.callback.back_to_login', 'Вернуться ко входу')}
            </button>
          )}
          {status === 'loading' && (
            <div className="w-full h-1 bg-muted overflow-hidden rounded-full">
              <div className="h-full bg-primary animate-progress-flow" />
            </div>
          )}
          {status === 'recovery' && (
            <div className="space-y-4 w-full">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder={t('auth.callback.new_password_placeholder', 'Новый пароль (мин. 6 символов)')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isUpdating}
                  className="rounded-xl w-full"
                />
                <Input
                  type="password"
                  placeholder={t('auth.callback.confirm_password_placeholder', 'Подтвердите новый пароль')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isUpdating}
                  className="rounded-xl w-full"
                />
              </div>
              <Button 
                onClick={handleUpdatePassword}
                disabled={isUpdating}
                className="w-full rounded-xl"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {t('auth.callback.save_password', 'Сохранить новый пароль')}
              </Button>
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
