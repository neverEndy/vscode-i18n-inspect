import useTranslations from "./useTranslations";

const App = () => {
  const { t } = useTranslations();
  return (
    <div>
      <h1>{t("common.model.")}</h1>
=      <h1>{t("common.locale_formal.ar-EG")}</h1>
      <h1>{t("login.main_page.footer_copy_right")}</h1>

      <h1>{t_custom("common.creation.list")}</h1>
      <h1>{t_custom("commo")}</h1>
      <h1>{t_custom("fuck")}</h1>
      <Trans
        i18nKey="common.creation.list"
        >
          fuck
        </Trans>
      <Trans i18nKey="common"/>
    </div>
  );
};
