import { CodeGenerationPage } from '../../../../../components/ai-code-generation/pages/CodeGenerationPage';

interface GenerateCodePageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function GenerateCodePage({ params }: GenerateCodePageProps) {
  const id = await params.id;
  const locale = await params.locale;
  return <CodeGenerationPage projectId={id} locale={locale} />;
}