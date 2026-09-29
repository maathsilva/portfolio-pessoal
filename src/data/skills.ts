export interface SkillGroup {
  icon: string;
  title: string;
  items: string[];
}

// Mesma lista do currículo (seção "Habilidades Técnicas"), categoria por categoria.
export const skillGroups: SkillGroup[] = [
  {
    icon: 'code',
    title: 'Linguagens & Análise de Dados',
    items: ['Python (Pandas, NumPy, Matplotlib)', 'SQL', 'PySpark'],
  },
  {
    icon: 'cloud',
    title: 'Cloud & Data Platforms',
    items: ['Azure Data Platform', 'Databricks'],
  },
  {
    icon: 'database',
    title: 'Bancos de Dados',
    items: ['Oracle', 'SQL Server', 'PostgreSQL', 'MySQL', 'MongoDB'],
  },
  {
    icon: 'bar-chart',
    title: 'BI & Visualização',
    items: ['Power BI (DAX, Power Query)', 'Tableau', 'Google Data Studio', 'Excel Avançado'],
  },
  {
    icon: 'workflow',
    title: 'Engenharia de Dados & ETL',
    items: ['Airflow', 'Spark', 'Hadoop', 'ETL/ELT', 'Data Pipelines'],
  },
  {
    icon: 'layers',
    title: 'Ferramentas & Versionamento',
    items: ['Git', 'Access', 'Google Sheets'],
  },
  {
    icon: 'check-square',
    title: 'Metodologias',
    items: ['Scrum', 'Kanban', 'DataOps'],
  },
];
