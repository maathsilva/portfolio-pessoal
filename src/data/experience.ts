/** A bullet, or a bullet with nested items (e.g. the systems inside an ecosystem). */
export type Bullet = string | { text: string; items: string[] };

export interface Experience {
  company: string;
  role: string;
  /** Consulting client the role was allocated to. */
  client?: string;
  period: string;
  current?: boolean;
  bullets: Bullet[];
}

// Mirrors the résumé (public/assets/docs/Matheus_Silva_Analista_de_Dados.pdf).
// The site also names the databases used day to day (PL/SQL, PostgreSQL, Oracle SQL).
export const experience: Experience[] = [
  {
    company: 'Spread Tecnologia',
    role: 'Analista de Dados',
    client: 'Transpetro',
    period: 'out/2026 — Atual',
    current: true,
    bullets: [
      'Analiso, valido e trato dados corporativos em Oracle com SQL e PL/SQL, garantindo integridade, consistência e qualidade das informações.',
      'Levanto requisitos com as áreas de negócio e traduzo as necessidades em modelos de dados relacionais e documentação técnica.',
      'Desenvolvo e valido procedures, functions, packages, triggers e views em PL/SQL, assegurando performance e estabilidade das aplicações.',
      'Otimizo consultas SQL com tuning de performance, reduzindo tempos de resposta e aumentando a eficiência dos sistemas.',
      'Atuo na governança e padronização dos dados corporativos, garantindo aderência às políticas de dados, à LGPD e às diretrizes de segurança da informação.',
    ],
  },
  {
    company: 'Spread Tecnologia',
    role: 'Analista de Dados',
    client: 'Ipiranga',
    period: 'nov/2025 — set/2026',
    bullets: [
      'Administrei o Informatica PowerCenter de ponta a ponta, incluindo configuração, monitoramento e governança da plataforma.',
      'Conduzi a esteira de deploy dos processos ETL, garantindo entregas consistentes e rastreáveis.',
      'Garanti a qualidade dos processos ETL com validação, auditoria e correção de falhas de desempenho e de lógica, usando consultas em PL/SQL e PostgreSQL.',
      'Idealizei e desenvolvi o Faster, solução de auditoria e governança dos processos ETL integrada à API do PowerCenter.',
      'Idealizei e desenvolvi o Orus, plataforma integrada via API para gestão automatizada de acessos, conexões e permissões em massa, reduzindo o tempo de provisionamento de 30 para 2 minutos (93%).',
      'Prestei suporte técnico aos desenvolvedores, orientando boas práticas e otimização de fluxos, e capacitei equipes em Informatica PowerCenter e Informatica Intelligent Cloud Services (IICS).',
    ],
  },
  {
    company: 'Capital Consig',
    role: 'Analista de Negócios',
    period: 'mai/2025 — nov/2025',
    bullets: [
      {
        text: 'Desenvolvi um ecossistema de sistemas internos em Python e SQL (Mordomo, Zion e Nero) para automação de processos financeiros:',
        items: [
          'Mordomo: automação do download e da consolidação de relatórios financeiros, reduzindo o tempo de extração de 30 para 5 minutos (83%).',
          'Zion: limpeza, validação e reconciliação de bases financeiras com mais de R$ 40 milhões em valores processados, garantindo precisão e rastreabilidade para auditoria.',
          'Nero: geração de relatórios financeiros detalhados e auditáveis, aumentando a confiabilidade das análises.',
        ],
      },
      'Criei dashboards e relatórios interativos em Power BI e Excel avançado, traduzindo dados complexos em indicadores de fácil leitura.',
      'Desenvolvi consultas SQL em Oracle SQL e PostgreSQL para análise de grandes volumes de dados e automatizei rotinas críticas, reduzindo erros manuais e tempo operacional.',
      'Otimizei um processo que levava 7 horas no Excel para 5 minutos com SQL, aumentando a produtividade e a consistência dos resultados.',
    ],
  },
  {
    company: 'Grupo AFEET (Authentic Feet)',
    role: 'Front Leader',
    period: 'mai/2019 — out/2024',
    bullets: [
      'Promovido de Front (vendedor) a Guide (especialista em produto, responsável por treinar novos colaboradores e administrar a loja) e depois a Front Leader.',
      'Criei e analisei KPIs operacionais e estratégicos, apoiando a gestão na tomada de decisão baseada em dados.',
      'Desenvolvi dashboards em Excel com tabelas dinâmicas, gráficos automatizados e acompanhamento de indicadores de desempenho.',
      'Aumentei a taxa de conversão de vendas de 8% para 14%, conquistando o prêmio de melhor taxa de conversão da rede (90 lojas) em 2022.',
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
    period: '2026 — atual',
    title: 'Pós-graduação Lato Sensu — Cloud Computing Corporativo',
    institution: 'Universidade São Judas Tadeu',
    description: 'Arquiteturas multicloud com AWS, Azure, Google Cloud e Oracle: escalabilidade, segurança e DevSecOps.',
    completed: false,
  },
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
