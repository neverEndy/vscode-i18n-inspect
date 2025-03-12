
const useTranslations = (namespace?: string | string[]) => {
  const t = (key: string, options?: Record<string, string>) => {
    return key;
  };

  return { t };
};

export default useTranslations;
