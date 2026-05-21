import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back', 'Назад')}
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mb-4">{t('legal.terms.title', 'Условия использования')}</h1>
        <p className="text-muted-foreground mb-8">{t('legal.lastUpdated', 'Обновлено')}: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        {(t('legal.terms.sections', { returnObjects: true }) as any[]).map((section, index) => (
          <div key={index}>
            <h2>{section.title}</h2>
            <p>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
