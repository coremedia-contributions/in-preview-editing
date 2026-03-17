import { type FC, useEffect, useState } from "react";
import { Button } from "@base-ui/react/button";
import { Menu } from "@base-ui/react/menu";
import { usePluginContext } from "../context/PluginContext.tsx";
import { ChevronDownIcon } from "lucide-react";
import menuStyles from "../styles/components/Menu.module.css";
import breadcrumbSelectorStyles from "../styles/components/BreadcrumbSelector.module.css";
import toolbarStyles from "../styles/components/Toolbar.module.css";
import { usePortalContainer } from "../hooks/usePortalContainer.ts";
import SVGIcon from "./SVGIcon.tsx";
import clsx from "clsx";

interface Props {
}

const BreadcrumbSelector: FC<Props> = () => {
  const container = usePortalContainer();
  const { contentMetadata } = usePluginContext();
  const contentId = contentMetadata?.contentId;
  const contentName = contentMetadata?.contentName;
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const index = contentMetadata?.breadcrumb.findIndex(item => item.contentId === contentId) ?? 0;

  useEffect(() => {
    setSelectedIndex(index);
  }, [index]);

  if (!contentMetadata?.breadcrumb) {
    return null;
  }

  // only one item in breadcrumb, no need to show dropdown
  if (contentMetadata.breadcrumb.length < 2) {
    return (
      <Button className={toolbarStyles.Button}>{contentName}</Button>
    );
  }

  return (

    <Menu.Root>
      <Menu.Trigger className={toolbarStyles.IconButton}>
        {contentMetadata.svgIcon && <SVGIcon svg={contentMetadata.svgIcon}/>}
        {contentMetadata?.breadcrumb[selectedIndex]?.contentName}<ChevronDownIcon/>
      </Menu.Trigger>
      <Menu.Portal container={container}>
        <Menu.Positioner className={menuStyles.Positioner} align={"start"} sideOffset={0}>
          <Menu.Popup className={menuStyles.Popup}>
            {contentMetadata?.breadcrumb.map((item, index) => (
              <Menu.Item key={index}
                         className={clsx(menuStyles.Item, index === selectedIndex ? breadcrumbSelectorStyles.ActiveItem : null)}
                         disabled={index === selectedIndex}
                         onClick={() => setSelectedIndex(index)}>
                {item.svgIcon && <SVGIcon svg={item.svgIcon}/>}
                {item.contentName}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};

export default BreadcrumbSelector;
