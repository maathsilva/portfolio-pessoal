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
      'Administração, governança e sustentação do ambiente Informatica PowerCenter, garantindo disponibilidade, performance e rastreabilidade dos processos ETL.',
      'Monitoramento, troubleshooting e otimização de workflows, sessions, mappings e SQL Overrides.',
      'Gestão da esteira de deploy ETL, controle de versões e conformidade entre ambientes.',
      'Auditoria técnica de processos ETL, assegurando padrões de desenvolvimento, qualidade e governança de dados.',
      'Suporte especializado a equipes de desenvolvimento, incidentes críticos e análise de causa raiz.',
      'Capacitação de equipes em Informatica PowerCenter e Informatica Intelligent Cloud Services (IICS).',
    ],
  },
  {
    company: 'Capital Consig',
    role: 'Analista de Negócios',
    period: 'mai/2025 — nov/2025',
    bullets: [
      'Desenvolvi um ecossistema de softwares internos (Zion, Mordomo, Nero) para automatizar processos financeiros de crédito consignado, com Python, SQL, Power BI e Excel avançado.',
      'Criação de dashboards interativos em Power BI e relatórios dinâmicos em Excel, com modelagem de dados e indicadores automatizados.',
      'Consultas SQL complexas para extração e tratamento de grandes volumes de dados, automatizando rotinas financeiras críticas.',
      'Otimização de processos que levavam 7 horas no Excel para 5 minutos via SQL, elevando a confiabilidade das informações.',
    ],
  },
  {
    company: 'Grupo AFEET',
    role: 'Front Leader',
    period: 'mai/2019 — out/2024',
    bullets: [
      'Liderança de equipe com foco em produtividade e cumprimento de metas mensais.',
      'Gestão de controle de estoque, incluindo inventários periódicos.',
      'Criação e análise de KPIs de curto e médio prazo para mensurar desempenho da equipe e das operações.',
      'Dashboards analíticos em Excel para visualização de dados e decisões estratégicas.',
      'Aumento da taxa de conversão de vendas de 8% para 14% — prêmio de melhor taxa da rede (90 lojas) em 2022.',
    ],
  },
];

export interface Education {
  period: string;
  title: string;
  institution: string;
  description: string;
  completed: boolean;
}

export const education: Education[] = [
  {
    period: '2026',
    title: 'Pós-graduação Lato Sensu — Ciência de Dados',
    institution: 'Universidade São Judas Tadeu',
    description: 'Análise, modelagem e aplicação de dados para negócios.',
    completed: true,
  },
  {
    period: '2025',
    title: 'Pós-graduação Lato Sensu — Inteligência Artificial',
    institution: 'Universidade São Judas Tadeu',
    description: 'Machine learning, deep learning e aplicações práticas de sistemas inteligentes.',
    completed: true,
  },
  {
    period: '2020 — 2024',
    title: 'Bacharelado — Engenharia de Software',
    institution: 'Universidade Cidade de São Paulo',
    description: 'Desenvolvimento de software, arquitetura de sistemas e boas práticas de engenharia.',
    completed: true,
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
  { title: 'Formação Excel', institution: 'Alura', year: '2024' },
  { title: 'Formação Modelagem de Dados', institution: 'Alura', year: '2024' },
  { title: 'Formação Databricks', institution: 'Alura', year: '2024' },
];
