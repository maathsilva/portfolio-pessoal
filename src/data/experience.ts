export interface Experience {
  company: string;
  role: string;
  period: string;
  current?: boolean;
  bullets: string[];
}

export const experience: Experience[] = [
  {
    company: 'Spread Tecnologia',
    role: 'Analista de Dados',
    period: 'nov/2025 — Atual',
    current: true,
    bullets: [
      'Administração completa do PowerCenter: configuração, monitoramento e governança da plataforma.',
      'Gestão e execução da esteira de deploy de processos ETL, garantindo entregas consistentes e rastreáveis.',
      'Validação, auditoria e correção de falhas de desempenho ou lógica nos processos ETL.',
      'Capacitação de equipes em Informatica PowerCenter e Informatica Intelligent Cloud Services (IICS).',
    ],
  },
  {
    company: 'Capital Consig',
    role: 'Analista de Negócios',
    period: 'mai/2025 — nov/2025',
    bullets: [
      'Desenvolvi um ecossistema de software interno (Zion, Mordomo, Nero) para automatizar processos financeiros.',
      'Criação de dashboards e relatórios interativos em Power BI e Excel avançado.',
      'Otimização de processos que levavam 7 horas no Excel para 5 minutos via SQL.',
    ],
  },
  {
    company: 'Grupo AFEET',
    role: 'Front Leader',
    period: 'mai/2019 — out/2024',
    bullets: [
      'Criação e análise de KPIs operacionais e estratégicos para apoiar decisões de gestão.',
      'Dashboards em Excel com tabelas dinâmicas e gráficos automatizados.',
      'Aumento da taxa de conversão de vendas de 8% para 14% — melhor taxa entre 90 lojas da rede.',
    ],
  },
];

export interface Education {
  period: string;
  title: string;
  institution: string;
  description: string;
}

export const education: Education[] = [
  {
    period: '2026',
    title: 'Pós-graduação Lato Sensu — Ciência de Dados',
    institution: 'Universidade São Judas Tadeu',
    description: 'Análise, modelagem e aplicação de dados para negócios.',
  },
  {
    period: '2025',
    title: 'Pós-graduação Lato Sensu — Inteligência Artificial',
    institution: 'Universidade São Judas Tadeu',
    description: 'Machine learning, deep learning e aplicações práticas de sistemas inteligentes.',
  },
  {
    period: '2020 — 2024',
    title: 'Bacharelado — Engenharia de Software',
    institution: 'Universidade Cidade de São Paulo',
    description: 'Desenvolvimento de software, arquitetura de sistemas e boas práticas de engenharia.',
  },
];

export interface Certification {
  title: string;
  institution: string;
  year: string;
}

export const certifications: Certification[] = [
  { title: 'Formação Python', institution: 'Alura', year: '2024' },
  { title: 'Formação SQL', institution: 'Alura', year: '2024' },
  { title: 'Formação Power BI', institution: 'Alura', year: '2024' },
  { title: 'Formação Modelagem de Dados', institution: 'Alura', year: '2024' },
  { title: 'Formação Databricks', institution: 'Alura', year: '2024' },
];
