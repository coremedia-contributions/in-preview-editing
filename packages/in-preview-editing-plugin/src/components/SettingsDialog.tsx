import { Dialog, Radio, RadioGroup, Slider, Switch } from "@base-ui/react";
import { usePortalContainer } from "../hooks/usePortalContainer.ts";
import { usePluginContext } from "../context/PluginContext.tsx";
import dialogStyles from "../styles/components/Dialog.module.css";
import { XIcon } from "lucide-react";
import clsx from "clsx";
import { type FC } from "react";

interface SettingsDialogProps {

}

const SettingsDialog: FC<SettingsDialogProps> = () => {
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

  return (
    <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
      <Dialog.Portal container={container}>
        <Dialog.Backdrop className={dialogStyles.Backdrop}/>
        <Dialog.Popup className={dialogStyles.Popup}>

          <div className={dialogStyles.PopupHeader}>
            <Dialog.Title className={dialogStyles.Title}>In-Preview Editing</Dialog.Title>
            <div className={dialogStyles.Subtitle}>Settings</div>
            <Dialog.Close className={dialogStyles.Close} aria-label="Close">
              <XIcon/>
            </Dialog.Close>
          </div>

          <div className={dialogStyles.Body}>

            <section className={dialogStyles.Section}>
              <h3 className={dialogStyles.SectionTitle}>Theme</h3>
              <div className={dialogStyles.SectionBody}>

                <div className={clsx(dialogStyles.Field, dialogStyles.ThemeColorField)}>

                  <label htmlFor="theme-color" className={dialogStyles.Label}>Color</label>
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
              <h3 className={dialogStyles.SectionTitle}>Spotlight</h3>
              <div className={dialogStyles.SectionBody}>

                <div className={clsx(dialogStyles.Field, dialogStyles.SwitchField)}>
                  <label htmlFor="use-spotlight" className={dialogStyles.Label}>Use Spotlight</label>
                  <Switch.Root id="use-spotlight"
                               checked={useSpotlight}
                               onCheckedChange={setUseSpotlight}
                               className={dialogStyles.Switch}>
                    <Switch.Thumb className={dialogStyles.SwitchThumb}/>
                  </Switch.Root>
                  <span
                    className={dialogStyles.FieldDescription}>Focus editable elements on hover and darken background</span>
                </div>

                {useSpotlight && (
                  <>
                    <div className={dialogStyles.Separator}></div>
                    <div className={clsx(dialogStyles.Field, dialogStyles.SliderField)}>
                      <label htmlFor="dimmer-value" className={dialogStyles.Label}>Dimming</label>
                      <Slider.Root id="dimmer-value"
                                   min={0} max={100}
                                   value={dimmerValue}
                                   onValueChange={setDimmerValue}>
                        <Slider.Control className={dialogStyles.SliderControl}>
                          <Slider.Track className={dialogStyles.SliderTrack}>
                            <Slider.Indicator className={dialogStyles.SliderIndicator}/>
                            <Slider.Thumb aria-label="Dimming" className={dialogStyles.SliderThumb}/>
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

        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SettingsDialog;
