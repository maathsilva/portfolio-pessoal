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
    role: 'Administrador de Dados (Transpetro)',
    period: 'out/2026 — Atual',
    current: true,
    bullets: [
      'Governança, padronização e modelagem de dados corporativos, garantindo integridade, consistência e aderência às políticas de dados.',
      'Levantamento e análise de requisitos junto às áreas de negócio para definição de modelos relacionais e documentação técnica.',
      'Desenvolvimento e validação de procedures, triggers, packages, functions e views em PL/SQL, assegurando performance e estabilidade das aplicações.',
      'Otimização de consultas SQL e tuning de performance, reduzindo tempos de resposta e melhorando a eficiência dos sistemas.',
      'Garantia da conformidade com a LGPD e diretrizes internas de segurança da informação.',
    ],
  },
  {
    company: 'Spread Tecnologia',
    role: 'Analista de Dados (Ipiranga)',
    period: 'nov/2025 — set/2026',
    bullets: [
      'Administração, governança e sustentação do ambiente Informatica PowerCenter, garantindo disponibilidade, performance e rastreabilidade dos processos ETL.',
      'Monitoramento, troubleshooting e otimização de workflows, sessions, mappings e SQL Overrides, com consultas e validações em PL/SQL e PostgreSQL.',
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
      'Consultas SQL complexas em Oracle SQL e PostgreSQL para extração e tratamento de grandes volumes de dados, automatizando rotinas financeiras críticas.',
      'Otimização de processos que levavam 7 horas no Excel para 5 minutos via SQL, elevando a confiabilidade das informações.',
    ],
  },
  {
    company: 'Grupo AFEET',
    role: 'Front Leader',
    period: 'set/2020 — out/2024',
    bullets: [
      'Liderança de equipe de vendas, com distribuição e acompanhamento de tarefas diárias, foco em produtividade e cumprimento de metas mensais.',
      'Criação e acompanhamento de KPIs de curto e médio prazo para mensurar o desempenho da equipe e das operações.',
      'Relatórios e dashboards analíticos em Excel avançado (tabelas dinâmicas, PROCV, gráficos automatizados) para visualização de dados e decisões estratégicas.',
      'Controle de estoque, com monitoramento de entrada e saída de mercadorias e inventários periódicos.',
      'Aumento da taxa de conversão de vendas de 8% para 14% (+75%) — prêmio de melhor taxa da rede (90 lojas) em 2022.',
    ],
  },
  {
    company: 'Grupo AFEET',
    role: 'Guide',
    period: 'fev/2020 — set/2020',
    bullets: [
      'Referência técnica em produtos, explicando de forma consultiva as tecnologias de calçados e roupas para apoiar a decisão de compra.',
      'Treinamento de novos colaboradores em conhecimento de produto, atendimento e processos da loja.',
      'Apoio à administração da operação da loja e acompanhamento da rotina da equipe.',
      'Disseminação de boas práticas de venda consultiva entre os vendedores.',
    ],
  },
  {
    company: 'Grupo AFEET',
    role: 'Front',
    period: 'mai/2019 — fev/2020',
    bullets: [
      'Vendas diretas de calçados e roupas, com atendimento consultivo e foco na jornada do cliente, do primeiro contato ao pós-venda.',
      'Tratamento de objeções e resolução de problemas, garantindo satisfação e fidelização.',
      'Operação de PDV e fechamento de caixa; entrada e conferência de mercadorias.',
      'Apoio à organização da loja e aos processos de abertura e fechamento.',
    ],
  },
];

export interface Education {
  period: string;
  title: string;
  institution: string;
  description: string;
  completed: boolean;
  file?: string;
}

export const education: Education[] = [
  {
    period: '2026',
    title: 'Pós-graduação Lato Sensu — Ciência de Dados',
    institution: 'Universidade São Judas Tadeu',
    description: 'Análise, modelagem e aplicação de dados para negócios.',
    completed: true,
    file: 'diploma-ciencia-de-dados.pdf',
  },
  {
    period: '2025',
    title: 'Pós-graduação Lato Sensu — Inteligência Artificial',
    institution: 'Universidade São Judas Tadeu',
    description: 'Machine learning, deep learning e aplicações práticas de sistemas inteligentes.',
    completed: true,
    file: 'diploma-inteligencia-artificial.pdf',
  },
  {
    period: '2020 — 2024',
    title: 'Bacharelado — Engenharia de Software',
    institution: 'Universidade Cidade de São Paulo',
    description: 'Desenvolvimento de software, arquitetura de sistemas e boas práticas de engenharia.',
    completed: true,
    file: 'diploma-engenharia-software.pdf',
  },
];

export interface Certification {
  title: string;
  institution: string;
  year: string;
  file?: string;
}

export const certifications: Certification[] = [
  { title: 'Formação Databricks', institution: 'Udemy', year: '2026', file: 'certificado-databricks.pdf' },
  { title: 'Formação Python', institution: 'Alura', year: '2024', file: 'certificado-python.pdf' },
  { title: 'Formação SQL', institution: 'Alura', year: '2024', file: 'certificado-sql.pdf' },
  { title: 'Formação Power BI', institution: 'Alura', year: '2024', file: 'certificado-power-bi.pdf' },
  { title: 'Formação Excel', institution: 'Alura', year: '2024', file: 'certificado-excel.pdf' },
  { title: 'Formação Modelagem de Dados', institution: 'Alura', year: '2024', file: 'certificado-modelagem-dados.pdf' },
];
