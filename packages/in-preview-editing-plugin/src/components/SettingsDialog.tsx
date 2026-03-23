import { Dialog, Radio, RadioGroup, Slider, Switch } from "@base-ui/react";
import { usePortalContainer } from "../hooks/usePortalContainer.ts";
import { usePluginContext } from "../context/PluginContext.tsx";
import clsx from "clsx";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import actionManager from "../lib/action-manager.ts";
import buttonStyles from "../styles/components/Button.module.css";
import dialogStyles from "../styles/components/Dialog.module.css";

const SettingsDialog: FC = () => {
  const { t } = useTranslation();
  const container = usePortalContainer();
  const {
    showSettings,
    setShowSettings,
    useSpotlight,
    setUseSpotlight,
    dimmerValue,
    setDimmerValue,
    accentColor,
    setAccentColor
  } = usePluginContext();

  const predefinedColors = ["#ADFF2F", "lightseagreen", "orange", "magenta", "purple", "blue"];

  const saveAndClose = () => {
    const newPreferences = {
      "ipe.themeColor": accentColor,
      "ipe.spotlight": true,
      "ipe.spotlightDimming": dimmerValue
    };
    actionManager.getInstance().postUserPreferencesUpdate(newPreferences);
    setShowSettings(false);
  };

  return (
    <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
      <Dialog.Portal container={container}>
        <Dialog.Backdrop className={dialogStyles.Backdrop}/>
        <Dialog.Popup className={dialogStyles.Popup}>

          <div className={dialogStyles.Header}>
            <Dialog.Title className={dialogStyles.Title}>{t("settings.title")}</Dialog.Title>
            <div className={dialogStyles.Subtitle}>{t("settings.subtitle")}</div>
          </div>

          <div className={dialogStyles.Body}>

            <section className={dialogStyles.Section}>
              <h3 className={dialogStyles.SectionTitle}>{t("settings.theme.title")}</h3>
              <div className={dialogStyles.SectionBody}>

                <div className={clsx(dialogStyles.Field, dialogStyles.ThemeColorField)}>

                  <label htmlFor="theme-color" className={dialogStyles.Label}>{t("settings.theme.color")}</label>
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                  />

                  <RadioGroup id={"theme-color"}
                              value={accentColor}
                              onValueChange={setAccentColor}
                              className={dialogStyles.RadioGroup}>

                    {predefinedColors.map((color) => (
                      <label className={dialogStyles.RadioGroupItem}>
                        <Radio.Root value={color} className={dialogStyles.Radio} style={{ background: color }}>
                          <Radio.Indicator className={dialogStyles.RadioIndicator}/>
                        </Radio.Root>
                        <span className={dialogStyles.RadioLabel}>{color}</span>
                      </label>
                    ))}

                  </RadioGroup>

                </div>

              </div>
            </section>

            <section className={dialogStyles.Section}>
              <h3 className={dialogStyles.SectionTitle}>{t("settings.spotlight.title")}</h3>
              <div className={dialogStyles.SectionBody}>

                <div className={clsx(dialogStyles.Field, dialogStyles.SwitchField)}>
                  <label htmlFor="use-spotlight"
                         className={dialogStyles.Label}>{t("settings.spotlight.useSpotlight")}</label>
                  <Switch.Root id="use-spotlight"
                               checked={useSpotlight}
                               onCheckedChange={setUseSpotlight}
                               className={dialogStyles.Switch}>
                    <Switch.Thumb className={dialogStyles.SwitchThumb}/>
                  </Switch.Root>
                  <span
                    className={dialogStyles.FieldDescription}>{t("settings.spotlight.description")}</span>
                </div>

                {useSpotlight && (
                  <>
                    <div className={dialogStyles.Separator}></div>
                    <div className={clsx(dialogStyles.Field, dialogStyles.SliderField)}>
                      <label htmlFor="dimmer-value"
                             className={dialogStyles.Label}>{t("settings.spotlight.dimming")}</label>
                      <Slider.Root id="dimmer-value"
                                   min={0} max={100}
                                   value={dimmerValue}
                                   onValueChange={setDimmerValue}>
                        <Slider.Control className={dialogStyles.SliderControl}>
                          <Slider.Track className={dialogStyles.SliderTrack}>
                            <Slider.Indicator className={dialogStyles.SliderIndicator}/>
                            <Slider.Thumb aria-label={t("settings.spotlight.dimming")}
                                          className={dialogStyles.SliderThumb}/>
                          </Slider.Track>
                        </Slider.Control>
                      </Slider.Root>
                      <span>{dimmerValue}%</span>
                    </div>
                  </>
                )}

              </div>

            </section>

          </div>

          <div className={dialogStyles.Footer}>
            <Dialog.Close className={buttonStyles.Button}>{t("settings.cancel")}</Dialog.Close>
            <button type="submit" className={buttonStyles.Button} onClick={saveAndClose}>{t("settings.save")}</button>
          </div>

        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SettingsDialog;
