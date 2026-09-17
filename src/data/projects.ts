export interface ProjectImage {
  file: string;
  alt: string;
  caption: string;
}

export interface Project {
  slug: string;
  title: string;
  subtitle: string;
  context: 'Corporativo' | 'Pessoal';
  timeframe: string;
  tags: string[];
  cover: string;
  problem: string;
  solution: string[];
  architecture: string[];
  results: { label: string; value: string }[];
  resultsNote?: string;
  learnings: string;
  code?: {
    filename: string;
    lang: string;
    snippet: string;
  };
  gallery: ProjectImage[];
  featured: boolean;
}

export const projects: Project[] = [
  {
    slug: 'projeto-faster',
    title: 'Faster',
    subtitle:
      'Automação da documentação e auditoria de processos ETL via API do Informatica PowerCenter.',
    context: 'Corporativo',
    timeframe: '2025 — Spread Tecnologia',
    tags: ['API', 'Informatica PowerCenter', 'ETL', 'Governança'],
    cover: 'faster1.png',
    problem:
      'A documentação técnica de processos ETL (metadados, SQL Overrides, mappings, sessions e transformações) no Informatica PowerCenter era feita manualmente: cada alteração de pipeline exigia revisitar XMLs exportados à mão para manter rastreabilidade e auditoria em dia. O processo consumia horas por ciclo e era a principal fonte de divergência entre o que rodava em produção e o que estava documentado.',
    solution: [
      'Integração direta com a API do Informatica PowerCenter para extração automatizada de metadados e XMLs de definição de cada processo.',
      'Parser que decompõe SQL Overrides, mappings, sessions e transformações em uma estrutura de dados normalizada.',
      'Geração automática de documentação técnica a partir dessa estrutura, sempre sincronizada com o que está publicado na plataforma.',
      'Trilha de auditoria consultável, eliminando a dependência de atualização manual de planilhas de controle.',
    ],
    architecture: [
      'Camada de integração via API REST do PowerCenter para extração de metadados e XMLs.',
      'Parsing e normalização em Python, com regras específicas por tipo de objeto ETL.',
      'Geração de artefatos de documentação versionáveis, prontos para auditoria.',
    ],
    results: [
      { label: 'Esforço operacional', value: '-85%' },
      { label: 'Rastreabilidade', value: '100% dos processos documentados' },
    ],
    resultsNote: 'Métrica reportada em ambiente de produção na Spread Tecnologia.',
    learnings:
      'Trabalhar diretamente com a API de uma ferramenta de ETL corporativa (fora do fluxo padrão de UI) exige entender a fundo o modelo de metadados do PowerCenter — foi o projeto que mais aprofundou meu conhecimento em governança de pipelines de dados em escala.',
    gallery: [
      { file: 'faster1.png', alt: 'Painel de extração de metadados do Faster', caption: 'Extração automatizada de metadados via API.' },
      { file: 'faster2.png', alt: 'Documentação gerada automaticamente', caption: 'Documentação técnica gerada a partir dos XMLs.' },
      { file: 'faster3.png', alt: 'Trilha de auditoria de processos ETL', caption: 'Trilha de auditoria por processo.' },
      { file: 'faster4.png', alt: 'Visão consolidada de Mappings e Sessions', caption: 'Visão consolidada de Mappings, Sessions e Lookups.' },
    ],
    featured: true,
  },
  {
    slug: 'projeto-orus',
    title: 'Orus',
    subtitle: 'Plataforma para automação de gestão de acessos, permissões, conexões e folders no ambiente Informatica PowerCenter.',
    context: 'Corporativo',
    timeframe: '2025 — Spread Tecnologia',
    tags: ['API', 'Automação', 'PowerCenter', 'IAM'],
    cover: 'orus1.png',
    problem:
      'Provisionar acessos, permissões, conexões e folders no ambiente PowerCenter era uma rotina manual, repetitiva e sujeita a erro humano, com cada solicitação levando cerca de 30 minutos para ser processada — um gargalo direto para as equipes que dependiam desses acessos para trabalhar.',
    solution: [
      'Plataforma integrada via API que centraliza a criação, alteração e revogação de acessos em lote.',
      'Regras de permissão parametrizáveis, eliminando a necessidade de intervenção manual por solicitação.',
      'Fila de processamento com validação automática antes da efetivação de cada mudança.',
    ],
    architecture: [
      'Orquestração via API para os sistemas de origem dos acessos e conexões.',
      'Camada de regras de negócio para validar permissões antes da aplicação.',
      'Processamento em lote para provisionamento em massa.',
    ],
    results: [
      { label: 'Tempo de provisionamento', value: '30 min → 2 min' },
      { label: 'Eficiência operacional', value: '+93%' },
    ],
    learnings:
      'O maior ganho não foi só de velocidade: padronizar as regras de permissão em código tornou o processo auditável, algo que a operação manual anterior não permitia.',
    gallery: [
      { file: 'orus1.png', alt: 'Painel de provisionamento de acessos do Orus', caption: 'Painel de provisionamento em massa.' },
      { file: 'orus2.png', alt: 'Regras de permissão configuráveis', caption: 'Regras de permissão parametrizáveis.' },
      { file: 'orus3.png', alt: 'Fila de processamento de solicitações', caption: 'Fila de processamento com validação automática.' },
      { file: 'orus4.png', alt: 'Histórico de provisionamento', caption: 'Histórico auditável de provisionamento.' },
    ],
    featured: true,
  },
  {
    slug: 'projeto-zion',
    title: 'Zion',
    subtitle: 'Aplicação desktop (PyQt5) para limpeza e validação de dados financeiros com regras dinâmicas por convênio.',
    context: 'Corporativo',
    timeframe: '2025 — Capital Consig',
    tags: ['Python', 'PostgreSQL', 'PyQt5'],
    cover: 'zion4.png',
    problem:
      'Processar e validar dados financeiros de múltiplos convênios (INSS, Zetra, Consiglog, entre outros) era manual e sujeito a erro: cada convênio tinha layout de arquivo, regras de negócio e nomenclatura de colunas diferentes, e as bases envolvidas somavam mais de R$ 40 milhões em valores processados — qualquer inconsistência tinha impacto direto em auditoria e tomada de decisão.',
    solution: [
      'Interface desktop dividida em "Limpeza de Planilhas" e "Validador de Convênios", com regras específicas por tipo de convênio.',
      'Módulo de limpeza dinâmico, dirigido por um dicionário de regras aplicado conforme o convênio selecionado.',
      'Carga dos arquivos para tabelas em PostgreSQL, com schemas pré-definidos ou gerados dinamicamente.',
      'Execução de scripts SQL transacionais (commit/rollback) para validação e cálculo por convênio.',
    ],
    architecture: [
      'PyQt5 para a interface desktop.',
      'PostgreSQL como camada de persistência e validação via SQL transacional.',
      'Configuração de conexão isolada em um módulo próprio, testável pela própria interface.',
    ],
    results: [
      { label: 'Volume validado', value: 'R$ 40M+ em bases processadas' },
      { label: 'Rastreabilidade', value: 'Validação auditável ponta a ponta' },
    ],
    learnings:
      'Regras de negócio distintas por convênio só se tornam sustentáveis quando modeladas como dados (dicionário de regras), não como condicionais espalhados pelo código — foi a decisão de design que mais facilitou adicionar novos convênios depois.',
    code: {
      filename: 'validacao_base.py',
      lang: 'python',
      snippet: `import psycopg2
from design.settings_manager import get_db_config

def run_validation_process(convenio, file_paths, output_path, progress_callback=None):
    conn = None
    try:
        current_db_config = get_db_config()
        conn = psycopg2.connect(**current_db_config)
        cur = conn.cursor()

        for i, (table_name, file_path) in enumerate(file_paths.items()):
            progress_callback and progress_callback.emit(
                10 + int((i / len(file_paths)) * 65), f"Importando '{table_name}'..."
            )
            import_csv_to_postgres(conn, cur, table_name, file_path, convenio)

        conn.autocommit = False
        cur.execute("BEGIN;")
        try:
            for step in steps:
                if step["sql"].strip():
                    cur.execute(step["sql"])
            conn.commit()
        except Exception as e_sql:
            conn.rollback()
            raise Exception(f"Erro na etapa SQL '{step['name']}': {e_sql}")
        finally:
            conn.autocommit = True
    finally:
        if conn:
            cur.close()
            conn.close()`,
    },
    gallery: [
      { file: 'zion1.png', alt: 'Aba Limpeza de Planilhas do Zion', caption: 'Aba "Limpeza de Planilhas".' },
      { file: 'zion3.png', alt: 'Limpeza configurada para um convênio específico', caption: 'Limpeza configurada por convênio.' },
      { file: 'zion2.png', alt: 'Aba Validador de Convênios', caption: 'Aba "Validador de Convênios".' },
      { file: 'zion5.png', alt: 'Modal de configuração do banco de dados', caption: 'Modal de configuração da conexão com o banco.' },
    ],
    featured: true,
  },
  {
    slug: 'projeto-mordomo',
    title: 'Mordomo',
    subtitle: 'Automação centralizada de downloads e consolidação de relatórios de múltiplos portais financeiros.',
    context: 'Corporativo',
    timeframe: '2025 — Capital Consig',
    tags: ['Python', 'Selenium', 'PyQt5'],
    cover: 'mordomo1.png',
    problem:
      'A extração de relatórios financeiros de múltiplos portais era feita manualmente, portal por portal, consumindo cerca de 30 minutos por ciclo — tempo que crescia proporcionalmente ao número de fontes e não escalava com o volume de operações.',
    solution: [
      'Interface gráfica única para disparar o download e a consolidação de relatórios de múltiplos portais.',
      'Robôs de automação (Selenium) para navegação e extração, eliminando o acesso manual portal a portal.',
      'Consolidação automática dos relatórios extraídos em uma saída padronizada.',
    ],
    architecture: [
      'PyQt5 para a interface de controle e acompanhamento dos downloads.',
      'Selenium para automação de navegação e extração nos portais de origem.',
      'Camada de consolidação para padronizar os relatórios antes da entrega final.',
    ],
    results: [
      { label: 'Tempo de extração', value: '30 min → 5 min' },
      { label: 'Tempo de execução', value: '-83%' },
    ],
    learnings:
      'Automação de portais de terceiros é frágil por natureza (layouts mudam sem aviso) — a maior parte do esforço de manutenção do Mordomo foi projetar falhas de forma que o robô avisasse em vez de simplesmente travar.',
    gallery: [
      { file: 'mordomo1.png', alt: 'Painel principal do Mordomo', caption: 'Painel de controle dos downloads.' },
      { file: 'mordomo2.png', alt: 'Seleção de portais financeiros', caption: 'Seleção dos portais a processar.' },
      { file: 'mordomo3.png', alt: 'Execução em andamento no Mordomo', caption: 'Execução automatizada em andamento.' },
      { file: 'mordomo4.png', alt: 'Relatório consolidado gerado pelo Mordomo', caption: 'Relatório consolidado de saída.' },
    ],
    featured: false,
  },
  {
    slug: 'projeto-nero',
    title: 'Nero',
    subtitle: 'Consolidação de dados validados e geração de relatórios Excel auditáveis.',
    context: 'Corporativo',
    timeframe: '2025 — Capital Consig',
    tags: ['Python', 'Pandas', 'Excel'],
    cover: 'nero1.png',
    problem:
      'Depois que os dados eram limpos e validados (fluxo do Zion), montar os relatórios analíticos finais em Excel — no formato Consolidado e Individual — ainda era um trabalho manual, repetido a cada ciclo de fechamento.',
    solution: [
      'Ferramenta que consome os dados já validados e gera automaticamente os relatórios Consolidado e Individual.',
      'Formatação padronizada aplicada via Pandas, eliminando ajuste manual de planilha.',
      'Saída pronta para auditoria, sem etapas intermediárias manuais entre validação e relatório final.',
    ],
    architecture: [
      'Pandas para agregação e formatação dos dados de saída.',
      'Geração de arquivos Excel formatados prontos para distribuição.',
    ],
    results: [
      { label: 'Etapas manuais eliminadas', value: 'Consolidação e formatação' },
      { label: 'Confiabilidade', value: 'Relatórios auditáveis por construção' },
    ],
    learnings:
      'Separar claramente "validação de dados" (Zion) de "geração de relatório" (Nero) em ferramentas distintas facilitou isolar problemas: um relatório errado nunca era culpa de dado sujo, porque essa etapa já tinha passado por outro controle.',
    gallery: [
      { file: 'nero1.png', alt: 'Tela inicial do Nero', caption: 'Tela inicial de geração de relatórios.' },
      { file: 'nero2.png', alt: 'Relatório consolidado gerado pelo Nero', caption: 'Relatório consolidado formatado.' },
    ],
    featured: false,
  },
  {
    slug: 'projeto-luno',
    title: 'Luno',
    subtitle: 'Aplicação desktop (PyQt5) para criação e gestão automatizada de escalas de trabalho semanais.',
    context: 'Pessoal',
    timeframe: '2024',
    tags: ['Python', 'PyQt5', 'Algoritmos'],
    cover: 'luno1.png',
    problem:
      'Montar escalas de trabalho semanais para uma equipe de farmácia manualmente é um problema combinatório: é preciso respeitar disponibilidade, carga horária e regras de rodízio, o que torna o processo lento e propenso a inconsistências quando feito à mão.',
    solution: [
      'Aplicação desktop onde o gestor cadastra colaboradores, disponibilidade e regras de rodízio.',
      'Algoritmo de geração de escala que aplica essas regras automaticamente para montar a semana.',
      'Interface para ajuste manual pontual sobre a escala gerada, sem perder o que já foi validado.',
    ],
    architecture: [
      'PyQt5 para a interface de cadastro e visualização da escala.',
      'Módulo de geração de escala baseado em regras de disponibilidade e rodízio.',
    ],
    results: [
      { label: 'Escopo', value: 'Projeto pessoal, fora de contexto corporativo' },
    ],
    resultsNote: 'Sem métricas de produção — desenvolvido como estudo de algoritmos de agendamento aplicados a um problema real.',
    learnings:
      'Modelar "disponibilidade + regras de rodízio" como restrições explícitas, em vez de tentar prever todos os casos manualmente, foi o que tornou o gerador de escala extensível a novas regras sem reescrever a lógica principal.',
    gallery: [
      { file: 'luno1.png', alt: 'Cadastro de colaboradores no Luno', caption: 'Cadastro de colaboradores e disponibilidade.' },
      { file: 'luno2.png', alt: 'Configuração de regras de rodízio', caption: 'Configuração de regras de rodízio.' },
      { file: 'luno3.png', alt: 'Escala semanal gerada pelo Luno', caption: 'Escala semanal gerada automaticamente.' },
      { file: 'luno4.png', alt: 'Ajuste manual da escala gerada', caption: 'Ajuste manual sobre a escala gerada.' },
    ],
    featured: false,
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
