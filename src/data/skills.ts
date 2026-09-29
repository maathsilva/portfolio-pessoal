export interface SkillGroup {
  icon: string;
  title: string;
  items: string[];
}

// Base: lista do currículo (seção "Habilidades Técnicas"). Cloud & Data
// Platforms também inclui AWS, GCP e Oracle Cloud — em estudo, fora da
// pós-graduação em Cloud Computing (ainda não iniciada).
export const skillGroups: SkillGroup[] = [
  {
    icon: 'code',
    title: 'Linguagens & Análise de Dados',
    items: ['Python (Pandas, NumPy, Matplotlib)', 'SQL', 'PySpark'],
  },
  {
    icon: 'cloud',
    title: 'Cloud & Data Platforms',
    items: ['Azure Data Platform', 'AWS', 'Google Cloud Platform (GCP)', 'Oracle Cloud', 'Databricks'],
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
