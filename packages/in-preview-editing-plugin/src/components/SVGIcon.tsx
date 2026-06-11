import type { FC } from "react";
import parse, { domToReact } from "html-react-parser";
import type { DOMNode, Element } from "html-react-parser";
import iconStyles from "../styles/components/Icon.module.css";

interface Props {
  svg: string;
  className?: string;
  size?: number;
}

const isSvgElement = (node: DOMNode): node is Element =>
  "name" in node && (node as Element).name === "svg";

const SVGIcon: FC<Props> = ({ svg, className = iconStyles.Icon, size = 22}) => {
  const svgElement = parse(svg, {
    replace(node) {
      if (isSvgElement(node as DOMNode)) {
        const element = node as Element;
        const existingClass = element.attribs.class ?? "";
        const mergedClass = [existingClass, className].filter(Boolean).join(" ");
        return (
          <svg {...element.attribs} className={mergedClass} width={`${size}px`} height={`${size}px`}>
            {domToReact(element.children as DOMNode[])}
          </svg>
        );
      }
    },
  });
  return <>{svgElement}</>;
}

export default SVGIcon;
