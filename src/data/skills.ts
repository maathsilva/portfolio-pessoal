export interface SkillGroup {
  icon: string;
  title: string;
  items: string[];
  usedIn?: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    icon: 'code',
    title: 'Linguagens & Análise de Dados',
    items: ['Python (Pandas, NumPy, Matplotlib)', 'SQL', 'PySpark'],
    usedIn: ['Zion', 'Nero', 'Mordomo', 'Luno'],
  },
  {
    icon: 'cloud',
    title: 'Cloud & Data Platforms',
    items: ['Azure Data Platform', 'Databricks'],
  },
  {
    icon: 'database',
    title: 'Bancos de Dados',
    items: ['PostgreSQL', 'Oracle', 'SQL Server', 'MySQL', 'MongoDB'],
    usedIn: ['Zion'],
  },
  {
    icon: 'bar-chart',
    title: 'BI & Visualização',
    items: ['Power BI (DAX, Power Query)', 'Tableau', 'Google Data Studio', 'Excel Avançado'],
    usedIn: ['Nero'],
  },
  {
    icon: 'workflow',
    title: 'Engenharia de Dados & ETL',
    items: ['Informatica PowerCenter', 'Informatica IICS', 'Airflow', 'Spark', 'Hadoop', 'ETL/ELT', 'Data Pipelines'],
    usedIn: ['Faster'],
  },
  {
    icon: 'shield',
    title: 'Automação & Governança',
    items: ['Selenium', 'Auditoria de processos', 'Validação e reconciliação de dados', 'Git'],
    usedIn: ['Orus', 'Mordomo', 'Faster'],
  },
];
