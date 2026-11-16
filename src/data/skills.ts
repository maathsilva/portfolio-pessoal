export interface SkillGroup {
  icon: string;
  title: string;
  items: string[];
}

// Mirrors the "Habilidades Técnicas" section of the résumé
// (public/assets/docs/Matheus_Silva_Analista_de_Dados.pdf) — keep both in sync.
export const skillGroups: SkillGroup[] = [
  {
    icon: 'database',
    title: 'Linguagens & Bancos de Dados',
    items: ['SQL', 'PL/SQL', 'Python (Pandas, NumPy, Matplotlib)', 'Oracle Database', 'SQL Server', 'PostgreSQL', 'MySQL'],
  },
  {
    icon: 'workflow',
    title: 'Engenharia de Dados, ETL & Cloud',
    items: [
      'Informatica PowerCenter',
      'Informatica IICS',
      'Databricks',
      'Microsoft Azure',
      'Apache Spark / PySpark',
      'Apache Airflow',
      'Hadoop',
      'ETL/ELT',
    ],
  },
  {
    icon: 'check-square',
    title: 'Gestão & Qualidade de Dados',
    items: [
      'Modelagem de dados relacional',
      'Governança de dados',
      'Qualidade, validação e reconciliação de dados',
      'Tuning de SQL',
      'Documentação técnica',
      'LGPD',
    ],
  },
  {
    icon: 'bar-chart',
    title: 'BI & Visualização',
    items: ['Power BI (DAX, Power Query)', 'Tableau', 'Excel avançado'],
  },
  {
    icon: 'cpu',
    title: 'IA & Ciência de Dados',
    items: ['Estatística aplicada', 'Scikit-learn', 'IA generativa', 'LLMs', 'RAG', 'Prompt engineering'],
  },
  {
    icon: 'git-branch',
    title: 'Versionamento',
    items: ['Git'],
  },
];
