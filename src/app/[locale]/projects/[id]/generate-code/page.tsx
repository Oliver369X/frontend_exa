import { CodeGenerationPage } from '../../../../../components/ai-code-generation/pages/CodeGenerationPage';

interface GenerateCodePageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default function GenerateCodePage({ params }: GenerateCodePageProps) {
  return <CodeGenerationPage projectId={params.id} locale={params.locale} />;
}