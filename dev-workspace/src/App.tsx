import useTranslations from "./useTranslations";

const App = () => {
  const { t } = useTranslations();
  return (
    <div>
      <h1>
        {
          t(
            "common.action.go_model_list",
            { count: 6 }
          )
        }
      </h1>
      <h1>
        {t("common.action.go_model_list",{ count: 6 })}
      </h1>
      <h1>{t("common.locale_formal.ar-EG")}</h1>
      <h1>{t("modal.effect_remove_voice.content")}</h1>
      <h1>{t(`common.locale_abbr.${language}`)}</h1>


      <h1>{t("哈哈")}</h1>
      <h1>{t("")}</h1>
      <h1>{t_custom("abab")}</h1>
      <Trans
        i18nKey="common.creation.list"
        >
          hi
        </Trans>
      <Trans i18nKey="abab"/>
      <Trans i18nKey="哈哈"/>
      <Trans i18nKey=""/>
    </div>
  );
};
