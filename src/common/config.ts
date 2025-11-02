// shared helpers for parsing env-driven configuration values
const TRUTHY_ENV_VALUES = new Set(['1', 'true', 'yes', 'y', 'on']);

const normalizeKey = (value: string): string => value.trim().toLowerCase();

const parseEnvList = (value?: string, delimiter: string = ','): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(delimiter)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

export const isWeeklyReportEnabled = (): boolean => {
  const rawValue = process.env.ENABLE_WEEKLY_REPORT ?? '';

  return TRUTHY_ENV_VALUES.has(rawValue.trim().toLowerCase());
};

export const getConfiguredProjects = (): string[] => {
  return parseEnvList(process.env.APP_PROJECTS);
};

export const getWeeklyReportProjectGroupMap = (): Record<string, string> => {
  const rawGroups = process.env.WEEKLY_REPORT_PROJECT_GROUPS;

  if (!rawGroups) {
    return {};
  }

  return rawGroups.split(';').reduce((acc, groupEntry) => {
    const [groupKey, projectsRaw] = groupEntry.split(':');

    if (!groupKey || !projectsRaw) {
      return acc;
    }

    const normalizedGroup = normalizeKey(groupKey);

    parseEnvList(projectsRaw, '|').forEach((projectName) => {
      acc[normalizeKey(projectName)] = normalizedGroup;
    });

    return acc;
  }, {} as Record<string, string>);
};

export const getWeeklyReportGroupOrder = (): string[] => {
  return ['frontend', 'mobile', 'backend'];
};

export const resolveWeeklyReportGroupLabel = (groupKey: string): string => {
  if (!groupKey) {
    return '';
  }

  const trimmed = groupKey.trim();

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

