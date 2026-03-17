import { Collapsible } from '@base-ui/react/collapsible';
import styles from '../styles/components/CollapsiblePanel.module.css';
import { Children, isValidElement, type FC, type ReactNode } from "react";
import { ChevronRightIcon } from "lucide-react";
import clsx from "clsx";

interface CollapsiblePanelProps {
  children: ReactNode;
  className?: string;
}

interface HeaderProps {
  children: ReactNode;
  className?: string;
}

interface BodyProps {
  children: ReactNode;
  className?: string;
}

type CollapsiblePanelComponent = FC<CollapsiblePanelProps> & {
  Header: FC<HeaderProps>;
  Body: FC<BodyProps>;
};

const CollapsiblePanel: CollapsiblePanelComponent = ({ children, className }) => {
  const childArray = Children.toArray(children);
  const headerChild = childArray.find(
    (child) => isValidElement(child) && child.type === Header
  );
  const bodyChildren = childArray.filter(
    (child) => isValidElement(child) && child.type === Body
  );

  return (
    <Collapsible.Root className={clsx(styles.Collapsible, className)}>
        {headerChild}
        {bodyChildren}
    </Collapsible.Root>
  );
}

const Header: FC<HeaderProps> = ({ children, className }) => {
  return (
    <Collapsible.Trigger className={clsx(styles.Trigger, className)}>
      <ChevronRightIcon className={styles.Icon} />
      {children}
    </Collapsible.Trigger>
  );
};

const Body: FC<BodyProps> = ({ children, className }) => {
  return (
    <Collapsible.Panel className={styles.Panel}>
      <div className={clsx(styles.Content, className)}>
        {children}
      </div>
    </Collapsible.Panel>
  );
};

CollapsiblePanel.Header = Header;
CollapsiblePanel.Body = Body;

export default CollapsiblePanel;
