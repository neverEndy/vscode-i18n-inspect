import store from "../store";
import { getI18nMatchesForLine } from "./matchers";
import { getNestedValue } from "./object-mapping";

/**
 * check if found translation contain $t("key") interpolated placeholders, then replace the key with the translation
 * e.g. $t(nested.key.hello) => $t(⤷ wellcome)
 */
export default function replaceInterpolatedPlaceholders(target: string, translation: typeof store.translations): string {
  let result = target;
  if (typeof target === "string" && target.includes("$t")) {
      getI18nMatchesForLine(target, 0).forEach((m) => {
          const nestedTranslation = getNestedValue(m.key, translation);
          if (typeof nestedTranslation === "string" && target) {
            result = target.replace(m.key, `⤷ ${nestedTranslation}`);
          }
      });
  }
  return result;
}